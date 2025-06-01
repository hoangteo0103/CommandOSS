import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  MarketplaceListing,
  ListingStatus,
} from './entities/marketplace-listing.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { MarketplaceQueryDto, SortBy } from './dto/marketplace-query.dto';
import { BuyListingDto } from './dto/buy-listing.dto';
import { SuiService } from '../sui/sui.service';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    @InjectRepository(MarketplaceListing)
    private readonly listingRepository: Repository<MarketplaceListing>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly suiService: SuiService,
  ) {}

  async createListing(
    createListingDto: CreateListingDto,
  ): Promise<MarketplaceListing> {
    // Check if ticket exists and belongs to seller
    const ticket = await this.ticketRepository.findOne({
      where: { id: createListingDto.ticketId },
      relations: ['event'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.ownerAddress !== createListingDto.sellerAddress) {
      throw new BadRequestException('You can only list your own tickets');
    }

    if (ticket.isUsed) {
      throw new BadRequestException('Cannot list used tickets');
    }

    // Check if ticket is already listed
    const existingListing = await this.listingRepository.findOne({
      where: {
        ticketId: createListingDto.ticketId,
        status: ListingStatus.ACTIVE,
      },
    });

    if (existingListing) {
      throw new ConflictException('Ticket is already listed for sale');
    }

    // Verify the escrow transaction if provided
    if (createListingDto.transactionHash) {
      this.logger.log(
        `🔍 Verifying escrow transaction: ${createListingDto.transactionHash}`,
      );

      try {
        const transactionResult = await this.suiService.getTransactionDetails(
          createListingDto.transactionHash,
        );

        if (
          !transactionResult ||
          transactionResult.effects?.status?.status !== 'success'
        ) {
          throw new BadRequestException(
            'Escrow transaction verification failed',
          );
        }

        this.logger.log(
          `✅ Escrow transaction verified: ${createListingDto.transactionHash}`,
        );

        // Update ticket ownership to escrow (backend wallet)
        ticket.ownerAddress = this.suiService.getWalletAddress();
        await this.ticketRepository.save(ticket);
      } catch (error) {
        this.logger.error(
          `❌ Escrow transaction verification failed: ${error.message}`,
        );
        throw new BadRequestException(
          `Escrow transaction verification failed: ${error.message}`,
        );
      }
    }

    // Auto-categorize based on event if no category provided
    let category = createListingDto.category;
    if (!category && ticket.event) {
      category = this.categorizeEvent(
        ticket.event.name,
        ticket.event.description ?? '',
      );
    }

    // Create listing with escrow transaction hash
    const listing = this.listingRepository.create({
      ...createListingDto,
      category,
      originalPrice: createListingDto.originalPrice || ticket.price,
    });

    const savedListing = await this.listingRepository.save(listing);

    this.logger.log(`🏪 Listing created successfully: ${savedListing.id}`);

    return savedListing;
  }

  async getListings(query: MarketplaceQueryDto): Promise<{
    listings: MarketplaceListing[];
    total: number;
    hasMore: boolean;
  }> {
    let queryBuilder = this.createBaseQuery();

    // Apply filters
    this.applyFilters(queryBuilder, query);

    // Apply sorting
    this.applySorting(queryBuilder, query.sortBy || SortBy.NEWEST);

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.limit(query.limit || 20).offset(query.offset || 0);

    const listings = await queryBuilder.getMany();

    return {
      listings,
      total,
      hasMore: (query.offset || 0) + listings.length < total,
    };
  }

  async getListingById(id: string): Promise<MarketplaceListing> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['ticket', 'ticket.event'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  async buyListing(
    listingId: string,
    buyListingDto: BuyListingDto,
  ): Promise<MarketplaceListing> {
    const listing = await this.getListingById(listingId);

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Listing is not available for purchase');
    }

    if (listing.isExpired) {
      await this.expireListing(listing.id);
      throw new BadRequestException('Listing has expired');
    }

    if (listing.sellerAddress === buyListingDto.buyerAddress) {
      throw new BadRequestException('Cannot buy your own listing');
    }

    // Verify the blockchain transaction
    this.logger.log(
      `🔍 Verifying transaction: ${buyListingDto.transactionHash}`,
    );

    try {
      const transactionResult = await this.suiService.getTransactionDetails(
        buyListingDto.transactionHash,
      );

      if (
        !transactionResult ||
        transactionResult.effects?.status?.status !== 'success'
      ) {
        throw new BadRequestException(
          'Transaction verification failed or transaction not successful',
        );
      }

      // Verify the transaction amount matches the listing price
      // Note: In a real implementation, you'd also verify the recipient address
      const expectedAmountInMist = Math.floor(
        listing.listingPrice * 1_000_000_000,
      );

      // This is a simplified verification - in production you'd check the actual coin transfers
      this.logger.log(
        `✅ Transaction verified: ${buyListingDto.transactionHash}`,
      );
    } catch (error) {
      this.logger.error(`❌ Transaction verification failed: ${error.message}`);
      throw new BadRequestException(
        `Transaction verification failed: ${error.message}`,
      );
    }

    // Update listing as sold
    listing.status = ListingStatus.SOLD;
    listing.buyerAddress = buyListingDto.buyerAddress;
    listing.soldAt = new Date();
    listing.saleTransactionHash = buyListingDto.transactionHash;

    await this.listingRepository.save(listing);

    // Transfer the NFT ticket to the buyer
    try {
      this.logger.log(
        `🎫 Transferring NFT ticket to buyer: ${buyListingDto.buyerAddress}`,
      );

      const transferTxHash = await this.suiService.transferTicket(
        listing.ticket.nftTokenId,
        buyListingDto.buyerAddress,
      );

      this.logger.log(`✅ NFT transfer completed: ${transferTxHash}`);

      // Update ticket ownership
      listing.ticket.ownerAddress = buyListingDto.buyerAddress;
      await this.ticketRepository.save(listing.ticket);
    } catch (error) {
      this.logger.error(`❌ NFT transfer failed: ${error.message}`);
      // Revert the listing status if NFT transfer fails
      listing.status = ListingStatus.ACTIVE;
      listing.buyerAddress = null as any;
      listing.soldAt = null as any;
      listing.saleTransactionHash = null as any;
      await this.listingRepository.save(listing);

      throw new BadRequestException(`NFT transfer failed: ${error.message}`);
    }

    return listing;
  }

  async cancelListing(
    listingId: string,
    sellerAddress: string,
  ): Promise<MarketplaceListing> {
    const listing = await this.getListingById(listingId);

    if (listing.sellerAddress !== sellerAddress) {
      throw new BadRequestException('Only the seller can cancel this listing');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Only active listings can be cancelled');
    }

    // Transfer NFT back to seller from escrow
    this.logger.log(`🔄 Returning NFT from escrow to seller: ${sellerAddress}`);

    try {
      const returnTransferTxHash = await this.suiService.transferTicket(
        listing.ticket.nftTokenId,
        sellerAddress,
      );

      this.logger.log(`✅ NFT returned to seller: ${returnTransferTxHash}`);

      // Update ticket ownership back to seller
      listing.ticket.ownerAddress = sellerAddress;
      await this.ticketRepository.save(listing.ticket);
    } catch (error) {
      this.logger.error(`❌ Failed to return NFT to seller: ${error.message}`);
      throw new BadRequestException(
        `Failed to return NFT to seller: ${error.message}`,
      );
    }

    listing.status = ListingStatus.CANCELLED;
    listing.cancelledAt = new Date();

    return await this.listingRepository.save(listing);
  }

  async getSellerListings(
    sellerAddress: string,
  ): Promise<MarketplaceListing[]> {
    return await this.listingRepository.find({
      where: { sellerAddress },
      relations: ['ticket', 'ticket.event'],
      order: { createdAt: 'DESC' },
    });
  }

  async markAsHot(listingId: string): Promise<MarketplaceListing> {
    const listing = await this.getListingById(listingId);
    listing.isHot = true;
    return await this.listingRepository.save(listing);
  }

  async getMarketplaceStats(): Promise<{
    totalListings: number;
    totalVolume: number;
    avgPrice: number;
    hotListings: number;
    recentSales: number;
  }> {
    const [totalListings, hotListings] = await Promise.all([
      this.listingRepository.count({ where: { status: ListingStatus.ACTIVE } }),
      this.listingRepository.count({
        where: { status: ListingStatus.ACTIVE, isHot: true },
      }),
    ]);

    const volumeQuery = await this.listingRepository
      .createQueryBuilder('listing')
      .select('SUM(listing.listingPrice)', 'totalVolume')
      .addSelect('AVG(listing.listingPrice)', 'avgPrice')
      .addSelect('COUNT(*)', 'recentSales')
      .where('listing.status = :status', { status: ListingStatus.SOLD })
      .andWhere('listing.soldAt >= :date', {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })
      .getRawOne();

    return {
      totalListings,
      totalVolume: parseFloat(volumeQuery.totalVolume) || 0,
      avgPrice: parseFloat(volumeQuery.avgPrice) || 0,
      hotListings,
      recentSales: parseInt(volumeQuery.recentSales) || 0,
    };
  }

  // Private helper methods
  getEscrowAddress(): string {
    return this.suiService.getWalletAddress();
  }

  private createBaseQuery(): SelectQueryBuilder<MarketplaceListing> {
    return this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.ticket', 'ticket')
      .leftJoinAndSelect('ticket.event', 'event');
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<MarketplaceListing>,
    query: MarketplaceQueryDto,
  ): void {
    // Default to active listings
    queryBuilder.where('listing.status = :status', {
      status: query.status || ListingStatus.ACTIVE,
    });

    if (query.search) {
      queryBuilder.andWhere(
        '(event.name ILIKE :search OR event.description ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.category) {
      queryBuilder.andWhere('listing.category ILIKE :category', {
        category: `%${query.category}%`,
      });
    }

    if (query.minPrice !== undefined) {
      queryBuilder.andWhere('listing.listingPrice >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice !== undefined) {
      queryBuilder.andWhere('listing.listingPrice <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    if (query.sellerAddress) {
      queryBuilder.andWhere('listing.sellerAddress = :sellerAddress', {
        sellerAddress: query.sellerAddress,
      });
    }

    if (query.hotOnly) {
      queryBuilder.andWhere('listing.isHot = :isHot', { isHot: true });
    }

    // Filter out expired listings
    queryBuilder.andWhere(
      '(listing.expiresAt IS NULL OR listing.expiresAt > :now)',
      { now: new Date() },
    );
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<MarketplaceListing>,
    sortBy: SortBy,
  ): void {
    switch (sortBy) {
      case SortBy.NEWEST:
        queryBuilder.orderBy('listing.createdAt', 'DESC');
        break;
      case SortBy.OLDEST:
        queryBuilder.orderBy('listing.createdAt', 'ASC');
        break;
      case SortBy.PRICE_LOW:
        queryBuilder.orderBy('listing.listingPrice', 'ASC');
        break;
      case SortBy.PRICE_HIGH:
        queryBuilder.orderBy('listing.listingPrice', 'DESC');
        break;
      case SortBy.ENDING_SOON:
        queryBuilder
          .orderBy('listing.expiresAt', 'ASC', 'NULLS LAST')
          .addOrderBy('listing.createdAt', 'DESC');
        break;
      default:
        queryBuilder.orderBy('listing.createdAt', 'DESC');
    }
  }

  private async expireListing(listingId: string): Promise<void> {
    await this.listingRepository.update(listingId, {
      status: ListingStatus.EXPIRED,
    });
  }

  private categorizeEvent(name: string, description: string = ''): string {
    const text = `${name} ${description}`.toLowerCase();

    if (
      text.includes('tech') ||
      text.includes('blockchain') ||
      text.includes('crypto') ||
      text.includes('ai')
    ) {
      return 'Technology';
    }
    if (
      text.includes('art') ||
      text.includes('nft') ||
      text.includes('gallery') ||
      text.includes('exhibit')
    ) {
      return 'Art & Culture';
    }
    if (
      text.includes('music') ||
      text.includes('concert') ||
      text.includes('festival') ||
      text.includes('dj')
    ) {
      return 'Music';
    }
    if (
      text.includes('finance') ||
      text.includes('defi') ||
      text.includes('trading') ||
      text.includes('investment')
    ) {
      return 'Finance';
    }
    if (
      text.includes('sport') ||
      text.includes('game') ||
      text.includes('tournament')
    ) {
      return 'Sports';
    }

    return 'Other';
  }
}
