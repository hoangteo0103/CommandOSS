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
    const event = this.eventRepository.create({
      ...createEventDto,
      date: new Date(createEventDto.date),
      status: createEventDto.status || 'published',
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
      console.error('Qdrant location search failed:', error);
      throw error;
    }
  }
}
