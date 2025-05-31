import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async create(@Body(new ValidationPipe()) createEventDto: CreateEventDto) {
    const event = await this.eventService.create(createEventDto);
    return {
      success: true,
      data: event,
      message: 'Event created successfully',
    };
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    if (search) {
      const events = await this.eventService.searchEvents(search);
      return {
        success: true,
        data: events,
        message: 'Events found',
      };
    }

    if (status) {
      const events = await this.eventService.findByStatus(status);
      return {
        success: true,
        data: events,
        message: 'Events found',
      };
    }

    const result = await this.eventService.findAll(pageNum, limitNum);
    return {
      success: true,
      ...result,
      message: 'Events retrieved successfully',
    };
  }

  @Get('upcoming')
  async findUpcoming() {
    const events = await this.eventService.findUpcoming();
    return {
      success: true,
      data: events,
      message: 'Upcoming events retrieved successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const event = await this.eventService.findOne(id);
    return {
      success: true,
      data: event,
      message: 'Event retrieved successfully',
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe()) updateEventDto: UpdateEventDto,
  ) {
    const event = await this.eventService.update(id, updateEventDto);
    return {
      success: true,
      data: event,
      message: 'Event updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.eventService.remove(id);
    return {
      success: true,
      message: 'Event deleted successfully',
    };
  }
}
