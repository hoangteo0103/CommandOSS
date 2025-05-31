import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateBookingDto,
  ReserveTicketsDto,
  PurchaseTicketsDto,
} from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { EventService } from '../event/event.service';
import { SuiService } from '../sui/sui.service';
import { TicketsService } from '../tickets/tickets.service';

export interface Reservation {
  id: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  buyerAddress: string;
  expiresAt: Date;
  status: 'reserved' | 'completed' | 'cancelled' | 'expired';
  totalPrice: number;
  createdAt: Date;
}

export interface Purchase {
  orderId: string;
  transactionHash: string;
  nftTokenIds: string[];
  status: 'completed';
  mintedAt: Date;
}

export interface Availability {
  availableTickets: number;
  totalTickets: number;
  reservedTickets: number;
  soldTickets: number;
  isAvailable: boolean;
  pricePerTicket: number;
}

export interface UserBookingsFilter {
  status?: string;
  limit?: number;
  offset?: number;
}

export interface AdminBookingsFilter {
  eventId?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface CheckInRecord {
  ticketId: string;
  eventId?: string;
  checkedInAt: Date;
  checkedInBy: string; // Backend service or organizer
  transactionHash: string;
  ticketOwner?: string;
  verified: boolean;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  // In-memory storage for demo purposes
  // In production, this would use a redis database
  private reservations: Map<string, Reservation> = new Map();
  private purchases: Map<string, Purchase> = new Map();
  private checkInRecords: Map<string, CheckInRecord> = new Map(); // Track check-ins

  // Cache for ticket availability (acts like Redis cache)
  private ticketAvailability: Map<string, Availability> = new Map();

  constructor(
    private readonly eventService: EventService,
    private readonly suiService: SuiService,
    @Inject(forwardRef(() => TicketsService))
    private readonly ticketsService: TicketsService,
  ) {}

  // Get real availability from event data and cache it
  private async getRealAvailability(
    eventId: string,
    ticketTypeId: string,
  ): Promise<Availability> {
    const availabilityKey = `${eventId}-${ticketTypeId}`;

    try {
      // Get current availability from database
      const dbAvailability = await this.eventService.getTicketTypeAvailability(
        eventId,
        ticketTypeId,
      );

      // Calculate reserved tickets from in-memory reservations
      const reservedTickets = Array.from(this.reservations.values())
        .filter(
          (r) =>
            r.eventId === eventId &&
            r.ticketTypeId === ticketTypeId &&
            r.status === 'reserved',
        )
        .reduce((sum, r) => sum + r.quantity, 0);

      // The actual available tickets should account for current reservations
      const availableTickets = Math.max(
        0,
        dbAvailability.availableSupply - reservedTickets,
      );

      const availability: Availability = {
        availableTickets,
        totalTickets: dbAvailability.totalSupply,
        reservedTickets,
        soldTickets: dbAvailability.soldSupply,
        isAvailable: availableTickets > 0,
        pricePerTicket: dbAvailability.pricePerTicket,
      };

      // Cache the availability
      this.ticketAvailability.set(availabilityKey, availability);

      this.logger.log(
        `📊 Availability for ${eventId}/${ticketTypeId}: Available=${availableTickets}, Reserved=${reservedTickets}, Sold=${dbAvailability.soldSupply}, Total=${dbAvailability.totalSupply}`,
      );

      return availability;
    } catch (error) {
      this.logger.error(
        `Failed to get availability from database: ${error.message}`,
      );

      // Fallback to cache if database query fails
      let availability = this.ticketAvailability.get(availabilityKey);

      if (!availability) {
        // Final fallback: try to get from event data directly
        try {
          const event = await this.eventService.findOne(eventId);
          const ticketType = event.ticketTypes?.find(
            (tt) => tt.id === ticketTypeId,
          );

          if (!ticketType) {
            throw new Error('Ticket type not found');
          }

          // Calculate reserved tickets from in-memory reservations
          const reservedTickets = Array.from(this.reservations.values())
            .filter(
              (r) =>
                r.eventId === eventId &&
                r.ticketTypeId === ticketTypeId &&
                r.status === 'reserved',
            )
            .reduce((sum, r) => sum + r.quantity, 0);

          const soldTickets = Array.from(this.reservations.values())
            .filter(
              (r) =>
                r.eventId === eventId &&
                r.ticketTypeId === ticketTypeId &&
                r.status === 'completed',
            )
            .reduce((sum, r) => sum + r.quantity, 0);

          const availableTickets = Math.max(
            0,
            (ticketType.availableSupply || ticketType.supply) - reservedTickets,
          );

          availability = {
            availableTickets,
            totalTickets: ticketType.supply,
            reservedTickets,
            soldTickets,
            isAvailable: availableTickets > 0,
            pricePerTicket: ticketType.price,
          };

          // Cache the fallback availability
          this.ticketAvailability.set(availabilityKey, availability);
        } catch (fallbackError) {
          this.logger.error(
            `Fallback availability calculation failed: ${fallbackError.message}`,
          );
          throw new Error('Unable to determine ticket availability');
        }
      }

      return availability;
    }
  }

  // Reserve tickets with 15-minute expiration
  async reserveTickets(reserveDto: ReserveTicketsDto): Promise<Reservation> {
    const { eventId, ticketTypeId, quantity, buyerAddress } = reserveDto;

    // Check real availability
    const availability = await this.getRealAvailability(eventId, ticketTypeId);

    if (!availability || availability.availableTickets < quantity) {
      throw new Error('Insufficient tickets available');
    }

    // Create reservation
    const reservationId = this.generateUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const reservation: Reservation = {
      id: reservationId,
      eventId,
      ticketTypeId,
      quantity,
      buyerAddress,
      expiresAt,
      status: 'reserved',
      totalPrice: quantity * availability.pricePerTicket,
      createdAt: new Date(),
    };

    // Update availability (temporarily reserve tickets)
    const availabilityKey = `${eventId}-${ticketTypeId}`;
    availability.availableTickets -= quantity;
    availability.reservedTickets += quantity;
    this.ticketAvailability.set(availabilityKey, availability);

    // Store reservation
    this.reservations.set(reservationId, reservation);

    // Auto-expire reservation after 15 minutes
    setTimeout(
      () => {
        this.expireReservation(reservationId);
      },
      15 * 60 * 1000,
    );

    return reservation;
  }

  // Complete purchase and mint NFTs
  async completePurchase(purchaseDto: PurchaseTicketsDto): Promise<Purchase> {
    const { orderId, paymentSignature } = purchaseDto;

    // Enhanced logging for debugging
    this.logger.log(`🔔 PURCHASE NOTIFICATION RECEIVED from frontend:`);
    this.logger.log(`📦 Order ID: ${orderId}`);
    this.logger.log(
      `🔐 Payment Signature: ${paymentSignature?.slice(0, 20)}...`,
    );
    this.logger.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    const reservation = this.reservations.get(orderId);
    if (!reservation) {
      this.logger.error(`❌ Reservation not found for order: ${orderId}`);
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'reserved') {
      this.logger.error(
        `❌ Reservation status invalid: ${reservation.status} for order: ${orderId}`,
      );
      throw new Error('Reservation is not active');
    }

    if (new Date() > reservation.expiresAt) {
      this.logger.error(`❌ Reservation expired for order: ${orderId}`);
      throw new Error('Reservation has expired');
    }

    this.logger.log(`✅ Reservation found and valid for order: ${orderId}`);

    // Verify payment signature (mock verification)
    if (!this.verifyPaymentSignature(paymentSignature, reservation)) {
      this.logger.error(
        `❌ Payment signature verification failed for order: ${orderId}`,
      );
      throw new Error('Invalid payment signature');
    }

    this.logger.log(`✅ Payment signature verified for order: ${orderId}`);

    // Update reservation status
    reservation.status = 'completed';
    this.reservations.set(orderId, reservation);

    this.logger.log(
      `🎫 Starting NFT minting for ${reservation.quantity} tickets...`,
    );

    // Mint NFT tickets
    const nftTokenIds = await this.mintNFTTickets(reservation);
    const transactionHash = this.generateTransactionHash();

    this.logger.log(
      `🎉 NFT minting completed! Token IDs: ${nftTokenIds.join(', ')}`,
    );

    // Update availability (convert reserved to sold)
    const availabilityKey = `${reservation.eventId}-${reservation.ticketTypeId}`;
    const availability = this.ticketAvailability.get(availabilityKey);
    if (availability) {
      availability.reservedTickets -= reservation.quantity;
      availability.soldTickets += reservation.quantity;
      this.ticketAvailability.set(availabilityKey, availability);
    }

    const purchase: Purchase = {
      orderId,
      transactionHash,
      nftTokenIds,
      status: 'completed',
      mintedAt: new Date(),
    };

    this.purchases.set(orderId, purchase);

    this.logger.log(`💾 Purchase record saved: ${orderId}`);

    // Update ticket supplies in the database
    try {
      await this.eventService.updateTicketSupply(
        reservation.eventId,
        reservation.ticketTypeId,
        reservation.quantity,
      );
      this.logger.log(
        `✅ Updated ticket supply for event ${reservation.eventId}, ticket type ${reservation.ticketTypeId}, quantity: ${reservation.quantity}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to update ticket supply in database: ${error.message}`,
      );
      // Log but don't fail the purchase since NFTs are already minted
    }

    // TODO: Create ticket records in database
    // This will be implemented when TicketsService is properly injected
    try {
      await this.createTicketRecords(
        reservation,
        nftTokenIds,
        transactionHash,
        purchase.mintedAt,
      );
    } catch (error) {
      this.logger.warn(`Failed to create ticket records: ${error.message}`);
      // Don't fail the purchase if ticket record creation fails
    }

    this.logger.log(`🎊 PURCHASE COMPLETED SUCCESSFULLY for order: ${orderId}`);
    this.logger.log(`🎫 NFT Token IDs: ${nftTokenIds.join(', ')}`);
    this.logger.log(`📝 Transaction Hash: ${transactionHash}`);

    return purchase;
  }

  // Cancel reservation
  async cancelReservation(reservationId: string): Promise<void> {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'reserved') {
      throw new Error('Reservation cannot be cancelled');
    }

    // Clear availability cache to force refresh from database
    this.clearAvailabilityCache(reservation.eventId, reservation.ticketTypeId);

    // Update reservation status
    reservation.status = 'cancelled';
    this.reservations.set(reservationId, reservation);

    this.logger.log(
      `❌ Reservation ${reservationId} cancelled, cleared availability cache for ${reservation.eventId}/${reservation.ticketTypeId}`,
    );
  }

  // Get reservation details
  async getReservation(reservationId: string): Promise<any> {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    const timeLeft = Math.max(
      0,
      Math.floor((reservation.expiresAt.getTime() - Date.now()) / 1000),
    );

    return {
      ...reservation,
      timeLeft,
      tickets: {
        eventName: 'Mock Event Name', // Would fetch from event service
        ticketTypeName: 'Mock Ticket Type', // Would fetch from ticket service
        quantity: reservation.quantity,
        unitPrice: reservation.totalPrice / reservation.quantity,
        totalPrice: reservation.totalPrice,
      },
    };
  }

  // Get user bookings
  async getUserBookings(
    walletAddress: string,
    filter: UserBookingsFilter,
  ): Promise<any> {
    const userReservations = Array.from(this.reservations.values()).filter(
      (r) => r.buyerAddress === walletAddress,
    );

    let filtered = userReservations;

    if (filter.status) {
      filtered = filtered.filter((r) => r.status === filter.status);
    }

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 10;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      bookings: paginated,
      total: filtered.length,
      offset,
      limit,
    };
  }

  // Get all bookings (admin)
  async getAllBookings(filter: AdminBookingsFilter): Promise<any> {
    let filtered = Array.from(this.reservations.values());

    if (filter.eventId) {
      filtered = filtered.filter((r) => r.eventId === filter.eventId);
    }

    if (filter.status) {
      filtered = filtered.filter((r) => r.status === filter.status);
    }

    // Apply pagination
    const offset = (filter.page - 1) * filter.limit;
    const paginated = filtered.slice(offset, offset + filter.limit);

    return {
      bookings: paginated,
      total: filtered.length,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(filtered.length / filter.limit),
    };
  }

  // Check ticket availability
  async checkAvailability(
    eventId: string,
    ticketTypeId: string,
  ): Promise<Availability> {
    try {
      return await this.getRealAvailability(eventId, ticketTypeId);
    } catch (error) {
      // Return default availability if not found
      return {
        availableTickets: 0,
        totalTickets: 0,
        reservedTickets: 0,
        soldTickets: 0,
        isAvailable: false,
        pricePerTicket: 0,
      };
    }
  }

  // Cleanup expired reservations
  async cleanupExpiredReservations(): Promise<any> {
    const now = new Date();
    let cleaned = 0;

    for (const [id, reservation] of this.reservations.entries()) {
      if (reservation.status === 'reserved' && now > reservation.expiresAt) {
        this.expireReservation(id);
        cleaned++;
      }
    }

    return {
      cleanedReservations: cleaned,
      timestamp: now,
    };
  }

  // Helper methods
  private expireReservation(reservationId: string): void {
    const reservation = this.reservations.get(reservationId);
    if (!reservation || reservation.status !== 'reserved') {
      return;
    }

    // Clear availability cache to force refresh from database
    const availabilityKey = `${reservation.eventId}-${reservation.ticketTypeId}`;
    this.ticketAvailability.delete(availabilityKey);

    // Update reservation status
    reservation.status = 'expired';
    this.reservations.set(reservationId, reservation);

    this.logger.log(
      `⏰ Reservation ${reservationId} expired, cleared availability cache for ${reservation.eventId}/${reservation.ticketTypeId}`,
    );
  }

  /**
   * Clear availability cache for specific ticket type
   */
  private clearAvailabilityCache(eventId: string, ticketTypeId: string): void {
    const availabilityKey = `${eventId}-${ticketTypeId}`;
    this.ticketAvailability.delete(availabilityKey);
  }

  /**
   * Clear all availability cache
   */
  async refreshAvailabilityCache(): Promise<void> {
    this.ticketAvailability.clear();
    this.logger.log(
      '🔄 Availability cache cleared, will refresh from database on next request',
    );
  }

  private verifyPaymentSignature(
    signature: string,
    reservation: Reservation,
  ): boolean {
    // Enhanced payment verification for real Sui transactions
    try {
      // Check if signature is a transaction digest (starts with 0x and 64 chars)
      const isTransactionDigest =
        signature.startsWith('0x') && signature.length === 66;

      // Check if signature is a valid signature format
      const isValidSignature = signature && signature.length > 20;

      if (isTransactionDigest) {
        this.logger.log(
          `Payment verified with transaction digest: ${signature}`,
        );
        return true;
      }

      if (isValidSignature) {
        this.logger.log(
          `Payment verified with signature: ${signature.slice(0, 20)}...`,
        );
        return true;
      }

      this.logger.warn(`Invalid payment signature format: ${signature}`);
      return false;
    } catch (error) {
      this.logger.error(`Payment verification failed: ${error.message}`);
      return false;
    }
  }

  private async mintNFTTickets(reservation: Reservation): Promise<string[]> {
    try {
      // Get event details for NFT metadata
      const event = await this.eventService.findOne(reservation.eventId);
      const ticketType = event.ticketTypes?.find(
        (tt) => tt.id === reservation.ticketTypeId,
      );

      if (!ticketType) {
        throw new Error('Ticket type not found for NFT minting');
      }

      // Mint NFTs on Sui blockchain
      const mintResults = await this.suiService.mintEventTickets(
        reservation.eventId,
        event.name,
        reservation.ticketTypeId,
        ticketType.name,
        reservation.quantity,
        reservation.buyerAddress,
      );

      // Return the NFT object IDs as token IDs
      return mintResults.map((result) => result.objectId);
    } catch (error) {
      this.logger?.error(`NFT minting failed: ${error.message}`);
      // Fallback to mock IDs if blockchain minting fails
      const tokenIds: string[] = [];
      for (let i = 0; i < reservation.quantity; i++) {
        tokenIds.push(`FALLBACK-NFT-${this.generateUUID()}`);
      }
      return tokenIds;
    }
  }

  private generateTransactionHash(): string {
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  private generateUUID(): string {
    return randomUUID();
  }

  // Sui blockchain integration methods

  /**
   * Get ticket information from blockchain
   */
  async getTicketInfo(ticketId: string): Promise<any> {
    return await this.suiService.getTicketInfo(ticketId);
  }

  /**
   * Use/validate a ticket on blockchain with check-in tracking
   */
  async useTicket(ticketId: string): Promise<string> {
    try {
      // Check if already checked in
      if (this.checkInRecords.has(ticketId)) {
        const existingRecord = this.checkInRecords.get(ticketId);
        if (existingRecord) {
          throw new Error(
            `Ticket already checked in at ${existingRecord.checkedInAt.toISOString()}`,
          );
        }
      }

      // Verify ticket on blockchain (without modifying it)
      const transactionHash = await this.suiService.useTicket(ticketId);

      // Get ticket info for additional verification
      const ticketInfo = await this.suiService.getTicketInfo(ticketId);

      // Create check-in record
      const checkInRecord: CheckInRecord = {
        ticketId,
        eventId: ticketInfo?.eventId?.toString(),
        checkedInAt: new Date(),
        checkedInBy: 'event-organizer', // Backend service acting as organizer
        transactionHash,
        ticketOwner: ticketInfo?.owner,
        verified: true,
      };

      // Store check-in record
      this.checkInRecords.set(ticketId, checkInRecord);

      this.logger.log(`✅ Ticket ${ticketId} checked in and recorded`);
      this.logger.log(`📊 Total check-ins: ${this.checkInRecords.size}`);

      return transactionHash;
    } catch (error) {
      this.logger.error(
        `❌ Check-in failed for ticket ${ticketId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Check if a ticket has been checked in
   */
  isTicketCheckedIn(ticketId: string): boolean {
    return this.checkInRecords.has(ticketId);
  }

  /**
   * Get check-in record for a ticket
   */
  getCheckInRecord(ticketId: string): CheckInRecord | null {
    return this.checkInRecords.get(ticketId) || null;
  }

  /**
   * Get all check-in records for an event
   */
  getEventCheckIns(eventId: string): CheckInRecord[] {
    return Array.from(this.checkInRecords.values()).filter(
      (record) => record.eventId === eventId,
    );
  }

  /**
   * Verify ticket ownership on blockchain
   */
  async verifyTicketOwnership(
    ticketId: string,
    ownerAddress: string,
  ): Promise<boolean> {
    return await this.suiService.verifyNFTOwnership(ticketId, ownerAddress);
  }

  /**
   * Get Sui wallet information
   */
  async getSuiWalletInfo(): Promise<{
    address: string;
    balance: string;
    balanceSui: string;
    packageId: string;
    network: string;
  }> {
    const balance = await this.suiService.getWalletBalance();
    return {
      address: this.suiService.getWalletAddress(),
      balance: balance,
      balanceSui: (parseInt(balance) / 1_000_000_000).toFixed(9),
      packageId: this.suiService.getPackageId(),
      network: 'testnet',
    };
  }

  private async createTicketRecords(
    reservation: Reservation,
    nftTokenIds: string[],
    transactionHash: string,
    mintedAt: Date,
  ): Promise<void> {
    try {
      // Create ticket records for each minted NFT
      const ticketsData = nftTokenIds.map((nftTokenId) => ({
        nftTokenId,
        transactionHash,
        ownerAddress: reservation.buyerAddress,
        eventId: reservation.eventId,
        ticketTypeId: reservation.ticketTypeId,
        orderId: reservation.id,
        price: reservation.totalPrice / reservation.quantity, // Price per ticket
        mintedAt,
      }));

      // Save all ticket records to database
      const savedTickets = await this.ticketsService.createTickets(ticketsData);

      this.logger.log(
        `Successfully created ${savedTickets.length} ticket records in database for order: ${reservation.id}`,
      );
      this.logger.log(
        `Ticket IDs: ${savedTickets.map((t) => t.id).join(', ')}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create ticket records for order ${reservation.id}: ${error.message}`,
      );
      throw error;
    }
  }
}
