import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { MarketplaceQueryDto } from './dto/marketplace-query.dto';
import { BuyListingDto } from './dto/buy-listing.dto';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('listings')
  @HttpCode(HttpStatus.CREATED)
  async createListing(
    @Body(ValidationPipe) createListingDto: CreateListingDto,
  ) {
    return {
      success: true,
      data: await this.marketplaceService.createListing(createListingDto),
      message: 'Listing created successfully',
    };
  }

  @Get('listings')
  async getListings(@Query(ValidationPipe) query: MarketplaceQueryDto) {
    const result = await this.marketplaceService.getListings(query);
    return {
      success: true,
      data: result.listings,
      meta: {
        total: result.total,
        hasMore: result.hasMore,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
      message: 'Listings retrieved successfully',
    };
  }

  @Get('listings/:id')
  async getListingById(@Param('id') id: string) {
    return {
      success: true,
      data: await this.marketplaceService.getListingById(id),
      message: 'Listing retrieved successfully',
    };
  }

  @Post('listings/:id/buy')
  @HttpCode(HttpStatus.OK)
  async buyListing(
    @Param('id') listingId: string,
    @Body() buyListingDto: BuyListingDto,
  ) {
    return {
      success: true,
      data: await this.marketplaceService.buyListing(listingId, buyListingDto),
      message: 'Purchase completed successfully',
    };
  }

  @Put('listings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelListing(
    @Param('id') listingId: string,
    @Body('sellerAddress') sellerAddress: string,
  ) {
    return {
      success: true,
      data: await this.marketplaceService.cancelListing(
        listingId,
        sellerAddress,
      ),
      message: 'Listing cancelled successfully',
    };
  }

  @Get('sellers/:address/listings')
  async getSellerListings(@Param('address') sellerAddress: string) {
    return {
      success: true,
      data: await this.marketplaceService.getSellerListings(sellerAddress),
      message: 'Seller listings retrieved successfully',
    };
  }

  @Put('listings/:id/mark-hot')
  @HttpCode(HttpStatus.OK)
  async markAsHot(@Param('id') listingId: string) {
    return {
      success: true,
      data: await this.marketplaceService.markAsHot(listingId),
      message: 'Listing marked as hot successfully',
    };
  }

  @Get('stats')
  async getMarketplaceStats() {
    return {
      success: true,
      data: await this.marketplaceService.getMarketplaceStats(),
      message: 'Marketplace stats retrieved successfully',
    };
  }

  @Get('categories')
  async getCategories() {
    return {
      success: true,
      data: [
        { value: 'technology', label: 'Technology' },
        { value: 'art', label: 'Art & Culture' },
        { value: 'music', label: 'Music' },
        { value: 'finance', label: 'Finance' },
        { value: 'sports', label: 'Sports' },
        { value: 'other', label: 'Other' },
      ],
      message: 'Categories retrieved successfully',
    };
  }

  @Get('escrow-address')
  async getEscrowAddress() {
    return {
      success: true,
      data: {
        escrowAddress: this.marketplaceService.getEscrowAddress(),
      },
      message: 'Escrow address retrieved successfully',
    };
  }
}
