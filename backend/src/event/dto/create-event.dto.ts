import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  ArrayMaxSize,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TicketTypeDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  supply: number;

  @IsNumber()
  availableSupply: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Event name must be at least 3 characters' })
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  description: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Location is required' })
  location: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  placeId?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Organizer name is required' })
  organizerName: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketTypeDto)
  ticketTypes?: TicketTypeDto[];

  @IsOptional()
  @IsString()
  status?: string;
}
