import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ name: 'place_id', nullable: true })
  placeId: string;

  @Column({ name: 'organizer_name' })
  organizerName: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({ name: 'banner_url', nullable: true })
  bannerUrl?: string;

  @Column('simple-array', { nullable: true })
  categories: string[];

  @Column({ type: 'json', nullable: true, name: 'ticket_types' })
  ticketTypes: {
    id: string;
    name: string;
    price: number;
    supply: number;
    availableSupply: number;
    description?: string;
  }[];

  @Column({ name: 'total_tickets', default: 0 })
  totalTickets: number;

  @Column({ name: 'available_tickets', default: 0 })
  availableTickets: number;

  @Column({ default: 'draft' })
  status: string; // draft, published, cancelled

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
