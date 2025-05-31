import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { EventModule } from '../event/event.module';
import { SuiModule } from '../sui/sui.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [EventModule, SuiModule, TicketsModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
