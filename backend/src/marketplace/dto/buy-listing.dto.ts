import { IsNotEmpty, IsString } from 'class-validator';

export class BuyListingDto {
  @IsNotEmpty()
  @IsString()
  buyerAddress: string;

  @IsNotEmpty()
  @IsString()
  transactionHash: string; // Required - must be a real blockchain transaction
}
