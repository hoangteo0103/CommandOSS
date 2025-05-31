import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      date: new Date(createEventDto.date),
      status: createEventDto.status || 'published',
    });

    return await this.eventRepository.save(event);
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
    return await this.eventRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
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
    return await this.eventRepository
      .createQueryBuilder('event')
      .where('event.name ILIKE :query OR event.description ILIKE :query', {
        query: `%${query}%`,
      })
      .orderBy('event.createdAt', 'DESC')
      .getMany();
  }
}
