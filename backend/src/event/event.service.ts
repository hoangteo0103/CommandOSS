import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { QdrantService } from '../qdrant/qdrant.service';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly qdrantService: QdrantService,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    // Calculate total tickets from ticket types
    const totalTickets =
      createEventDto.ticketTypes?.reduce(
        (sum, ticketType) => sum + ticketType.supply,
        0,
      ) || 0;

    const event = this.eventRepository.create({
      ...createEventDto,
      date: new Date(createEventDto.date),
      status: createEventDto.status || 'published',
      ticketTypes: createEventDto.ticketTypes || [],
      totalTickets,
      availableTickets: totalTickets, // Initially all tickets are available
    });

    const savedEvent = await this.eventRepository.save(event);

    // Index to Qdrant for search
    try {
      await this.qdrantService.indexEvent(savedEvent);
    } catch (error) {
      console.error('Failed to index event to Qdrant:', error);
      // Don't fail the main operation if indexing fails
    }

    return savedEvent;
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{
    data: Event[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [events, total] = await this.eventRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    const updateData = {
      ...updateEventDto,
      ...(updateEventDto.date && { date: new Date(updateEventDto.date) }),
    };

    Object.assign(event, updateData);
    const updatedEvent = await this.eventRepository.save(event);

    // Update index in Qdrant
    try {
      await this.qdrantService.indexEvent(updatedEvent);
    } catch (error) {
      console.error('Failed to update event in Qdrant:', error);
    }

    return updatedEvent;
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);

    // Remove from Qdrant first
    try {
      await this.qdrantService.deleteEvent(id);
    } catch (error) {
      console.error('Failed to delete event from Qdrant:', error);
    }

    await this.eventRepository.remove(event);
  }

  // Additional useful methods
  async findByStatus(status: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { status },
      order: { date: 'ASC' },
    });
  }

  async findUpcoming(): Promise<Event[]> {
    return await this.eventRepository.find({
      where: {
        date: MoreThanOrEqual(new Date()),
        status: 'published',
      },
      order: { date: 'ASC' },
    });
  }

  async searchEvents(query: string): Promise<Event[]> {
    // Try Qdrant search first for better results
    try {
      return await this.qdrantService.searchEventsByContent(query);
    } catch (error) {
      console.error(
        'Qdrant search failed, falling back to database search:',
        error,
      );

      // Fallback to database search
      return await this.eventRepository
        .createQueryBuilder('event')
        .where('event.name ILIKE :query OR event.description ILIKE :query', {
          query: `%${query}%`,
        })
        .orderBy('event.createdAt', 'DESC')
        .getMany();
    }
  }

  async searchEventsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20,
  ): Promise<Event[]> {
    try {
      return await this.qdrantService.searchEventsByLocation(
        latitude,
        longitude,
        radiusKm,
        limit,
      );
    } catch (error) {
      console.error(
        'Qdrant location search failed, falling back to database search:',
        error,
      );

      // Fallback to database search using JavaScript haversine calculation
      const eventsWithLocation = await this.eventRepository
        .createQueryBuilder('event')
        .where('event.latitude IS NOT NULL AND event.longitude IS NOT NULL')
        .getMany();

      // Calculate distances in JavaScript
      const eventsWithDistance = eventsWithLocation
        .map((event) => {
          const distance = this.calculateHaversineDistance(
            latitude,
            longitude,
            parseFloat(event.latitude.toString()),
            parseFloat(event.longitude.toString()),
          );
          return { event, distance };
        })
        .filter(({ distance }) => distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      console.log(
        `Found ${eventsWithDistance.length} events within ${radiusKm}km using database fallback`,
      );
      return eventsWithDistance.map(({ event }) => event);
    }
  }

  private calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLng = this.degreesToRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
