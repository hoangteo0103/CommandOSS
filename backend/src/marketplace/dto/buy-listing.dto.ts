import { IsString, IsOptional } from 'class-validator';

export class BuyListingDto {
  @IsString()
  listingId: string;

  @IsString()
  buyerAddress: string;

  @IsOptional()
  @IsString()
  transactionHash?: string;
}
