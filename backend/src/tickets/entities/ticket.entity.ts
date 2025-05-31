import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from '../../event/entities/event.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nft_token_id', unique: true })
  nftTokenId: string;

  @Column({ name: 'transaction_hash' })
  transactionHash: string;

  @Column({ name: 'owner_address' })
  ownerAddress: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ name: 'ticket_type_id' })
  ticketTypeId: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'is_used', default: false })
  isUsed: boolean;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date;

  @Column({ name: 'minted_at', type: 'timestamp' })
  mintedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Event, { eager: true })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  // Helper method to get ticket type from event
  get ticketType() {
    if (this.event && this.event.ticketTypes) {
      return this.event.ticketTypes.find((tt) => tt.id === this.ticketTypeId);
    }
    return null;
  }
}
