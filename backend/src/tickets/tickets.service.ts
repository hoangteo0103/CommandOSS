import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { SuiService } from '../sui/sui.service';

export interface CreateTicketData {
  nftTokenId: string;
  transactionHash: string;
  ownerAddress: string;
  eventId: string;
  ticketTypeId: string;
  orderId: string;
  price: number;
  mintedAt: Date;
}

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private suiService: SuiService,
  ) {}

  /**
   * Create a new ticket record after successful NFT minting
   */
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    try {
      const ticket = this.ticketRepository.create({
        nftTokenId: data.nftTokenId,
        transactionHash: data.transactionHash,
        ownerAddress: data.ownerAddress,
        eventId: data.eventId,
        ticketTypeId: data.ticketTypeId,
        orderId: data.orderId,
        price: data.price,
        mintedAt: data.mintedAt,
      });

      const savedTicket = await this.ticketRepository.save(ticket);
      this.logger.log(`Created ticket record for NFT: ${data.nftTokenId}`);

      return savedTicket;
    } catch (error) {
      this.logger.error(`Failed to create ticket record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create multiple ticket records (for bulk purchases)
   */
  async createTickets(ticketsData: CreateTicketData[]): Promise<Ticket[]> {
    try {
      const tickets = this.ticketRepository.create(ticketsData);
      const savedTickets = await this.ticketRepository.save(tickets);

      this.logger.log(`Created ${savedTickets.length} ticket records`);
      return savedTickets;
    } catch (error) {
      this.logger.error(`Failed to create ticket records: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all tickets for a user
   */
  async getUserTickets(userAddress: string): Promise<Ticket[]> {
    try {
      const tickets = await this.ticketRepository.find({
        where: { ownerAddress: userAddress },
        order: { createdAt: 'DESC' },
      });

      this.logger.log(
        `Found ${tickets.length} tickets for user ${userAddress}`,
      );
      return tickets;
    } catch (error) {
      this.logger.error(`Failed to get user tickets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific ticket by ID
   */
  async getTicketById(ticketId: string): Promise<Ticket> {
    try {
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
      }

      return ticket;
    } catch (error) {
      this.logger.error(`Failed to get ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a ticket by NFT token ID
   */
  async getTicketByNftId(nftTokenId: string): Promise<Ticket> {
    try {
      const ticket = await this.ticketRepository.findOne({
        where: { nftTokenId },
      });

      if (!ticket) {
        throw new NotFoundException(
          `Ticket with NFT ID ${nftTokenId} not found`,
        );
      }

      return ticket;
    } catch (error) {
      this.logger.error(`Failed to get ticket by NFT ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Use a ticket (mark as used)
   */
  async useTicket(ticketId: string): Promise<Ticket> {
    try {
      const ticket = await this.getTicketById(ticketId);

      if (ticket.isUsed) {
        throw new Error('Ticket has already been used');
      }

      // Check if event has already passed
      if (ticket.event && new Date(ticket.event.date) < new Date()) {
        throw new Error('This event has already ended');
      }

      // Update the ticket in database
      ticket.isUsed = true;
      ticket.usedAt = new Date();
      const updatedTicket = await this.ticketRepository.save(ticket);

      // Optionally update the NFT on blockchain
      try {
        await this.suiService.useTicket(ticket.nftTokenId);
        this.logger.log(
          `Marked NFT ticket ${ticket.nftTokenId} as used on blockchain`,
        );
      } catch (blockchainError) {
        this.logger.warn(
          `Failed to update NFT on blockchain: ${blockchainError.message}`,
        );
        // Continue - database update is more important than blockchain update
      }

      this.logger.log(`Ticket ${ticketId} marked as used`);
      return updatedTicket;
    } catch (error) {
      this.logger.error(`Failed to use ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify ticket authenticity using blockchain
   */
  async verifyTicket(ticketId: string): Promise<{
    isValid: boolean;
    ticket?: Ticket;
    blockchainInfo?: any;
  }> {
    try {
      const ticket = await this.getTicketById(ticketId);

      // Verify on blockchain
      const blockchainInfo = await this.suiService.getTicketInfo(
        ticket.nftTokenId,
      );

      const isValid =
        !!blockchainInfo && blockchainInfo.owner === ticket.ownerAddress;

      return {
        isValid,
        ticket,
        blockchainInfo,
      };
    } catch (error) {
      this.logger.error(`Failed to verify ticket: ${error.message}`);
      return {
        isValid: false,
      };
    }
  }

  /**
   * Get tickets for a specific event
   */
  async getEventTickets(eventId: string): Promise<Ticket[]> {
    try {
      const tickets = await this.ticketRepository.find({
        where: { eventId },
        order: { createdAt: 'DESC' },
      });

      return tickets;
    } catch (error) {
      this.logger.error(`Failed to get event tickets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get ticket statistics for an event
   */
  async getEventTicketStats(eventId: string): Promise<{
    totalMinted: number;
    totalUsed: number;
    totalUnused: number;
  }> {
    try {
      const tickets = await this.getEventTickets(eventId);

      const totalMinted = tickets.length;
      const totalUsed = tickets.filter((t) => t.isUsed).length;
      const totalUnused = totalMinted - totalUsed;

      return {
        totalMinted,
        totalUsed,
        totalUnused,
      };
    } catch (error) {
      this.logger.error(`Failed to get event ticket stats: ${error.message}`);
      throw error;
    }
  }
}
