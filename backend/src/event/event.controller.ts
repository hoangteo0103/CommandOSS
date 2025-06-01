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
  Put,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { HybridSearchService } from '../search/hybrid-search.service';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Event } from './entities/event.entity';

@Controller('events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly hybridSearchService: HybridSearchService,
  ) {}

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

  @Get('search/semantic')
  async semanticSearch(
    @Query('q') query?: string,
    @Query('limit') limit = 15,
    @Query('page') page = 1,
    @Query('categories') categories?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('organizerName') organizerName?: string,
    @Query('minLat') minLat?: string,
    @Query('maxLat') maxLat?: string,
    @Query('minLon') minLon?: string,
    @Query('maxLon') maxLon?: string,
  ) {
    try {
      const limitNum = Math.min(Math.max(Number(limit) || 15, 1), 100);
      const pageNum = Math.max(Number(page) || 1, 1);

      // Parse categories if provided as comma-separated string
      let parsedCategories: string[] | undefined;
      if (categories) {
        parsedCategories = categories
          .split(',')
          .map((cat) => cat.trim())
          .filter((cat) => cat);
      }

      // Parse geo coordinates
      const geoFilters: any = {};
      if (minLat && maxLat && minLon && maxLon) {
        geoFilters.minLat = parseFloat(minLat);
        geoFilters.maxLat = parseFloat(maxLat);
        geoFilters.minLon = parseFloat(minLon);
        geoFilters.maxLon = parseFloat(maxLon);
      }

      const filters = {
        categories: parsedCategories,
        startDate,
        endDate,
        status,
        organizerName,
        ...geoFilters,
      };

      const result = await this.hybridSearchService.searchEvents(
        query,
        filters,
        limitNum,
        pageNum,
      );

      return {
        success: true,
        result: result.events,
        page: result.page,
        limit: result.limit,
        total: result.total,
        message: `Found ${result.events.length} events`,
      };
    } catch (error) {
      return {
        success: false,
        result: [],
        page: 1,
        limit: 15,
        total: 0,
        message: 'Search failed',
        error: error.message,
      };
    }
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

  @Put(':id')
  @ApiOperation({
    summary: 'Update an event',
    description: 'Update an existing event by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    type: Event,
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateEventDto: Partial<CreateEventDto>,
  ) {
    try {
      const updatedEvent = await this.eventService.update(id, updateEventDto);
      return {
        success: true,
        data: updatedEvent,
        message: 'Event updated successfully',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error.message || 'Failed to update event',
        HttpStatus.BAD_REQUEST,
      );
    }
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
