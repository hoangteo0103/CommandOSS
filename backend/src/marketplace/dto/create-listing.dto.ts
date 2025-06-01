import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateListingDto {
  @IsString()
  ticketId: string;

  @IsString()
  sellerAddress: string;

  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  listingPrice: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  originalPrice: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  transactionHash?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
