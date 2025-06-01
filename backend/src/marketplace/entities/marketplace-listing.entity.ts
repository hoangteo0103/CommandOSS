import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('marketplace_listings')
@Index(['status', 'createdAt'])
@Index(['listingPrice'])
@Index(['category'])
export class MarketplaceListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id' })
  ticketId: string;

  @Column({ name: 'seller_address' })
  sellerAddress: string;

  @Column({ name: 'buyer_address', nullable: true })
  buyerAddress: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'listing_price',
  })
  listingPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'original_price',
  })
  originalPrice: number;

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.ACTIVE,
  })
  status: ListingStatus;

  @Column({ nullable: true })
  category: string;

  @Column({ name: 'transaction_hash', nullable: true })
  transactionHash: string;

  @Column({ name: 'sale_transaction_hash', nullable: true })
  saleTransactionHash: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'sold_at', type: 'timestamp', nullable: true })
  soldAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'is_hot', default: false })
  isHot: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Ticket, { eager: true })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  // Helper computed properties
  get isExpired(): boolean {
    return this.expiresAt && new Date() > this.expiresAt;
  }

  get priceChange(): number {
    return this.listingPrice - this.originalPrice;
  }

  get priceChangePercentage(): number {
    if (this.originalPrice === 0) return 0;
    return (
      ((this.listingPrice - this.originalPrice) / this.originalPrice) * 100
    );
  }
}
