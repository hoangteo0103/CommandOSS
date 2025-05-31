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
import { HybridSearchService } from '../search/hybrid-search.service';

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

  // Advanced semantic search endpoint (like Python FastAPI example)
  @Get('search/semantic')
  async semanticSearch(
    @Query('q') query?: string,
    @Query('limit') limit = 15,
    @Query('page') page = 1,
    @Query('city') city?: string,
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
        city: city?.toLowerCase(),
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

  @Get('search/location')
  async searchByLocation(
    @Query('lat') latitude: string,
    @Query('lng') longitude: string,
    @Query('radius') radius?: string,
    @Query('limit') limit?: string,
    @Query('q') query?: string,
  ) {
    if (!latitude || !longitude) {
      return {
        success: false,
        data: [],
        message: 'Latitude and longitude parameters are required',
      };
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = radius ? parseFloat(radius) : 10;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    if (isNaN(lat) || isNaN(lng)) {
      return {
        success: false,
        data: [],
        message: 'Invalid latitude or longitude values',
      };
    }

    try {
      const result = await this.eventService.searchEventsByLocation(
        lat,
        lng,
        radiusKm,
        limitNum,
      );

      return {
        success: true,
        data: result,
        message: `Found ${result.length} events within ${radiusKm}km`,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: 'Location search failed',
      };
    }
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
