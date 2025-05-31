import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUUID,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'The ID of the event',
    example: 'uuid-event-id',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  eventId: string;

  @ApiProperty({
    description: 'The ID of the ticket type',
    example: 'uuid-ticket-type-id',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  ticketTypeId: string;

  @ApiProperty({
    description: 'Number of tickets to book',
    example: 2,
    minimum: 1,
    maximum: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(5)
  quantity: number;

  @ApiProperty({
    description: 'Wallet address of the buyer',
    example: '0x1234567890abcdef...',
  })
  @IsNotEmpty()
  @IsString()
  buyerAddress: string;
}

export class ReserveTicketsDto extends CreateBookingDto {}

export class PurchaseTicketsDto {
  @ApiProperty({
    description: 'The order ID from reservation',
    example: 'uuid-order-id',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'Payment signature for verification',
    example: 'signed-transaction-hash',
  })
  @IsNotEmpty()
  @IsString()
  paymentSignature: string;
}
