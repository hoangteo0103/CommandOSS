import {
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { Ticket } from './entities/ticket.entity';

@ApiTags('tickets')
@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('my-tickets/:userAddress')
  @ApiOperation({
    summary: 'Get user tickets',
    description: 'Retrieve all NFT tickets owned by a specific user address',
  })
  @ApiParam({
    name: 'userAddress',
    description: 'The Sui wallet address of the user',
    example:
      '0x41e5467b71a5c1e12a596edb89b5ba9d335be6494c3d47a527c8c021f821ef9d',
  })
  @ApiResponse({
    status: 200,
    description: 'User tickets retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'e416a607-6923-4221-bd70-dad1003633c4',
              },
              nftTokenId: {
                type: 'string',
                example:
                  '0x923a41713d24603b8b76cd5c3af4020c464e262925e52578a154c7b5aae170dc',
              },
              transactionHash: { type: 'string', example: '0x9c58dfb3213698' },
              ownerAddress: {
                type: 'string',
                example:
                  '0x41e5467b71a5c1e12a596edb89b5ba9d335be6494c3d47a527c8c021f821ef9d',
              },
              eventId: { type: 'string' },
              ticketTypeId: { type: 'string' },
              price: { type: 'number', example: 50.0 },
              isUsed: { type: 'boolean', example: false },
              mintedAt: { type: 'string', format: 'date-time' },
              event: { type: 'object' },
              ticketType: { type: 'object' },
            },
          },
        },
        message: {
          type: 'string',
          example: 'User tickets retrieved successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user address format',
  })
  async getMyTickets(@Param('userAddress') userAddress: string) {
    try {
      if (!userAddress || userAddress.length < 10) {
        throw new BadRequestException('Invalid user address format');
      }

      const tickets = await this.ticketsService.getUserTickets(userAddress);

      return {
        success: true,
        data: tickets,
        message: 'User tickets retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to retrieve user tickets',
      );
    }
  }

  @Get('verify/:ticketId')
  @ApiOperation({
    summary: 'Verify ticket authenticity',
    description:
      'Verify ticket authenticity using blockchain and database records',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'The ticket ID to verify',
    example: 'e416a607-6923-4221-bd70-dad1003633c4',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket verification completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean', example: true },
            ticket: { type: 'object' },
            blockchainInfo: { type: 'object' },
          },
        },
        message: { type: 'string', example: 'Ticket verification completed' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async verifyTicket(@Param('ticketId') ticketId: string) {
    try {
      const verification = await this.ticketsService.verifyTicket(ticketId);

      return {
        success: true,
        data: verification,
        message: 'Ticket verification completed',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to verify ticket');
    }
  }

  @Post('tickets/:ticketId/use')
  @ApiOperation({
    summary: 'Use ticket',
    description: 'Mark a ticket as used (for event entry)',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'The ticket ID to mark as used',
    example: 'e416a607-6923-4221-bd70-dad1003633c4',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket marked as used successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: 'Ticket used successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Ticket already used or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async useTicket(@Param('ticketId') ticketId: string) {
    try {
      const ticket = await this.ticketsService.useTicket(ticketId);

      return {
        success: true,
        data: ticket,
        message: 'Ticket used successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to use ticket');
    }
  }

  @Get('events/:eventId/tickets')
  @ApiOperation({
    summary: 'Get event tickets',
    description: 'Get all tickets for a specific event (admin use)',
  })
  @ApiParam({
    name: 'eventId',
    description: 'The event ID',
    example: 'e416a607-6923-4221-bd70-dad1003633c4',
  })
  @ApiResponse({
    status: 200,
    description: 'Event tickets retrieved successfully',
  })
  async getEventTickets(@Param('eventId') eventId: string) {
    try {
      const tickets = await this.ticketsService.getEventTickets(eventId);

      return {
        success: true,
        data: tickets,
        message: 'Event tickets retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to retrieve event tickets',
      );
    }
  }

  @Get('events/:eventId/stats')
  @ApiOperation({
    summary: 'Get event ticket statistics',
    description: 'Get ticket statistics for a specific event',
  })
  @ApiParam({
    name: 'eventId',
    description: 'The event ID',
    example: 'e416a607-6923-4221-bd70-dad1003633c4',
  })
  @ApiResponse({
    status: 200,
    description: 'Event ticket statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            totalMinted: { type: 'number', example: 150 },
            totalUsed: { type: 'number', example: 75 },
            totalUnused: { type: 'number', example: 75 },
          },
        },
        message: {
          type: 'string',
          example: 'Event ticket statistics retrieved successfully',
        },
      },
    },
  })
  async getEventTicketStats(@Param('eventId') eventId: string) {
    try {
      const stats = await this.ticketsService.getEventTicketStats(eventId);

      return {
        success: true,
        data: stats,
        message: 'Event ticket statistics retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to retrieve event ticket statistics',
      );
    }
  }
}
