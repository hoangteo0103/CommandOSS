import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceListing } from './entities/marketplace-listing.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { SuiModule } from '../sui/sui.module';

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceListing, Ticket]), SuiModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
