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
} from 'class-validator';

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
  @IsString()
  status?: string;
}
