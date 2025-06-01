import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpException,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingService } from './booking.service';
import {
  ReserveTicketsDto,
  PurchaseTicketsDto,
} from './dto/create-booking.dto';
import { SuiService } from '../sui/sui.service';

@ApiTags('Booking & Reservations')
@Controller('booking')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly suiService: SuiService,
  ) {}

  // Reserve tickets (15-minute hold)
  @Post('reserve')
  @ApiOperation({
    summary: 'Reserve tickets with 15-minute hold',
    description:
      'Creates a temporary reservation for tickets that expires in 15 minutes',
  })
  @ApiResponse({
    status: 201,
    description: 'Tickets successfully reserved',
    schema: {
      example: {
        id: 'reservation-uuid',
        eventId: 'event-uuid',
        ticketTypeId: 'ticket-type-uuid',
        quantity: 2,
        buyerAddress: '0x...',
        expiresAt: '2024-01-15T10:30:00Z',
        status: 'reserved',
        totalPrice: 150.0,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or insufficient tickets available',
  })
  @ApiResponse({
    status: 409,
    description: 'Tickets no longer available',
  })
  async reserveTickets(@Body(ValidationPipe) reserveDto: ReserveTicketsDto) {
    try {
      const reservation = await this.bookingService.reserveTickets(reserveDto);
      return {
        success: true,
        data: reservation,
        message: 'Tickets reserved successfully for 15 minutes',
      };
    } catch (error) {
      if (error.message.includes('insufficient')) {
        throw new HttpException(
          'Insufficient tickets available',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        error.message || 'Failed to reserve tickets',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Complete purchase (mint NFTs)
  @Post('purchase')
  @ApiOperation({
    summary: 'Complete ticket purchase and mint NFTs',
    description:
      'Finalizes the purchase by processing payment and minting NFT tickets',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase completed and NFTs minted',
    schema: {
      example: {
        success: true,
        data: {
          orderId: 'order-uuid',
          transactionHash: '0x...',
          nftTokenIds: ['token-1', 'token-2'],
          status: 'completed',
          mintedAt: '2024-01-15T10:15:00Z',
        },
        message: 'NFT tickets minted successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payment signature or expired reservation',
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
  })
  async purchaseTickets(@Body(ValidationPipe) purchaseDto: PurchaseTicketsDto) {
    try {
      const purchase = await this.bookingService.completePurchase(purchaseDto);

      console.log('✅ PURCHASE CONTROLLER SUCCESS:', purchase.orderId);

      return {
        success: true,
        data: purchase,
        message: 'NFT tickets minted successfully',
      };
    } catch (error) {
      console.error('❌ PURCHASE CONTROLLER ERROR:', error.message);

      if (error.message.includes('not found')) {
        throw new HttpException(
          'Reservation not found or expired',
          HttpStatus.NOT_FOUND,
        );
      }
      if (error.message.includes('expired')) {
        throw new HttpException(
          'Reservation has expired',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        error.message || 'Failed to complete purchase',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Cancel reservation
  @Delete('reserve/:reservationId')
  @ApiOperation({
    summary: 'Cancel ticket reservation',
    description: 'Cancels an active reservation and releases the tickets',
  })
  @ApiParam({ name: 'reservationId', description: 'Reservation ID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation cancelled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
  })
  async cancelReservation(@Param('reservationId') reservationId: string) {
    try {
      await this.bookingService.cancelReservation(reservationId);
      return {
        success: true,
        message: 'Reservation cancelled successfully',
      };
    } catch (error) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
    }
  }

  // Get reservation status
  @Get('reserve/:reservationId')
  @ApiOperation({
    summary: 'Get reservation details',
    description: 'Retrieves current status and details of a reservation',
  })
  @ApiParam({ name: 'reservationId', description: 'Reservation ID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation details retrieved',
    schema: {
      example: {
        id: 'reservation-uuid',
        status: 'reserved',
        expiresAt: '2024-01-15T10:30:00Z',
        timeLeft: 847, // seconds
        tickets: {
          eventName: 'Blockchain Conference 2024',
          ticketTypeName: 'VIP Access',
          quantity: 2,
          unitPrice: 75.0,
          totalPrice: 150.0,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
  })
  async getReservation(@Param('reservationId') reservationId: string) {
    try {
      const reservation =
        await this.bookingService.getReservation(reservationId);
      return {
        success: true,
        data: reservation,
      };
    } catch (error) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
    }
  }

  // Get user's bookings
  @Get('user/:walletAddress')
  @ApiOperation({
    summary: 'Get user booking history',
    description: 'Retrieves all bookings for a specific wallet address',
  })
  @ApiParam({ name: 'walletAddress', description: 'User wallet address' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['reserved', 'completed', 'cancelled', 'expired'],
    description: 'Filter by booking status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results to return',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of results to skip',
  })
  @ApiResponse({
    status: 200,
    description: 'User bookings retrieved successfully',
  })
  async getUserBookings(
    @Param('walletAddress') walletAddress: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    try {
      const bookings = await this.bookingService.getUserBookings(
        walletAddress,
        { status, limit, offset },
      );
      return {
        success: true,
        data: bookings,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve bookings',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Admin: Get all bookings
  @Get('admin/all')
  @ApiOperation({
    summary: 'Get all bookings (Admin)',
    description: 'Admin endpoint to retrieve all bookings with filters',
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'eventId',
    required: false,
    description: 'Filter by event ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'All bookings retrieved successfully',
  })
  async getAllBookings(
    @Query('eventId') eventId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const bookings = await this.bookingService.getAllBookings({
        eventId,
        status,
        page: page || 1,
        limit: limit || 20,
      });
      return {
        success: true,
        data: bookings,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve bookings',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Check ticket availability
  @Get('availability/:eventId/:ticketTypeId')
  @ApiOperation({
    summary: 'Check ticket availability',
    description: 'Returns current availability for a specific ticket type',
  })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'ticketTypeId', description: 'Ticket type ID' })
  @ApiResponse({
    status: 200,
    description: 'Availability information retrieved',
    schema: {
      example: {
        availableTickets: 25,
        totalTickets: 100,
        reservedTickets: 5,
        soldTickets: 70,
        isAvailable: true,
        pricePerTicket: 75.0,
      },
    },
  })
  async checkAvailability(
    @Param('eventId') eventId: string,
    @Param('ticketTypeId') ticketTypeId: string,
  ) {
    try {
      const availability = await this.bookingService.checkAvailability(
        eventId,
        ticketTypeId,
      );
      return {
        success: true,
        data: availability,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to check availability',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Admin: Cleanup expired reservations
  @Post('admin/cleanup-expired')
  @ApiOperation({
    summary: 'Cleanup expired reservations (Admin)',
    description: 'Admin endpoint to cleanup expired reservations',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed successfully',
  })
  async cleanupExpiredReservations() {
    try {
      const result = await this.bookingService.cleanupExpiredReservations();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to cleanup reservations',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Ticket Verification and Usage endpoints

  @Get('ticket/:ticketId/info')
  @ApiOperation({
    summary: 'Get ticket information from blockchain',
    description: 'Retrieve ticket details from the Sui blockchain',
  })
  @ApiParam({ name: 'ticketId', description: 'NFT Ticket Object ID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket information retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async getTicketInfo(@Param('ticketId') ticketId: string) {
    try {
      const ticketInfo = await this.bookingService.getTicketInfo(ticketId);
      if (!ticketInfo) {
        throw new HttpException('Ticket not found', HttpStatus.NOT_FOUND);
      }
      return {
        success: true,
        data: ticketInfo,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get ticket info',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('check-in/:ticketId')
  @ApiOperation({
    summary: 'Check-in ticket for event entry',
    description:
      'Verify ticket on blockchain and record check-in (does not modify NFT)',
  })
  @ApiParam({ name: 'ticketId', description: 'NFT Ticket Object ID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket checked in successfully',
  })
  async checkInTicket(@Param('ticketId') ticketId: string) {
    try {
      // Check if already checked in first
      const existingCheckIn = this.bookingService.getCheckInRecord(ticketId);
      if (existingCheckIn) {
        return {
          success: false,
          message: 'Ticket already checked in',
          checkInRecord: existingCheckIn,
          alreadyCheckedIn: true,
        };
      }

      // Perform check-in
      const result = await this.bookingService.useTicket(ticketId);

      // Get ticket info and check-in record
      const ticketInfo = await this.suiService.getTicketInfo(ticketId);
      const checkInRecord = this.bookingService.getCheckInRecord(ticketId);

      return {
        success: true,
        message: 'Ticket successfully verified and checked in',
        ticket: ticketInfo,
        transactionHash: result,
        checkInRecord,
        verificationNote:
          'Ticket verified on Sui blockchain. Check-in recorded separately due to NFT ownership requirements.',
      };
    } catch (error) {
      const errorMessage = error.message || 'Check-in failed';

      // Handle specific error cases
      if (errorMessage.includes('already checked in')) {
        const checkInRecord = this.bookingService.getCheckInRecord(ticketId);
        return {
          success: false,
          message: 'Ticket already checked in',
          checkInRecord,
          alreadyCheckedIn: true,
        };
      }

      throw new HttpException(
        `Check-in failed: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('sui/wallet-info')
  @ApiOperation({
    summary: 'Get Sui wallet information',
    description: 'Get the backend Sui wallet address and balance',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet information retrieved successfully',
  })
  async getSuiWalletInfo() {
    try {
      const walletInfo = await this.bookingService.getSuiWalletInfo();
      return {
        success: true,
        data: walletInfo,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get wallet info',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('check-in/stats/:eventId')
  @ApiOperation({
    summary: 'Get check-in statistics for an event',
    description: 'Get check-in records and statistics for a specific event',
  })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Check-in statistics retrieved successfully',
  })
  async getEventCheckInStats(@Param('eventId') eventId: string) {
    try {
      const checkInRecords = this.bookingService.getEventCheckIns(eventId);

      return {
        success: true,
        data: {
          eventId,
          totalCheckIns: checkInRecords.length,
          checkInRecords: checkInRecords.map((record) => ({
            ticketId: record.ticketId,
            checkedInAt: record.checkedInAt,
            ticketOwner: record.ticketOwner,
            verified: record.verified,
          })),
          lastCheckIn:
            checkInRecords.length > 0
              ? checkInRecords[checkInRecords.length - 1].checkedInAt
              : null,
        },
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get check-in stats',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('admin/refresh-availability')
  @ApiOperation({
    summary: 'Refresh availability cache (Admin)',
    description: 'Clear availability cache to force refresh from database',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Availability cache refreshed successfully',
  })
  async refreshAvailabilityCache() {
    try {
      await this.bookingService.refreshAvailabilityCache();
      return {
        success: true,
        message: 'Availability cache refreshed successfully',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to refresh availability cache',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
