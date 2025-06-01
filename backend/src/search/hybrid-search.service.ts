import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigService } from '@nestjs/config';
import {
  createQdrantClient,
  EVENTS_COLLECTION_NAME,
  VECTOR_NAME,
} from '../config/qdrant.config';
import { EmbeddingService } from '../embeddings/embedding.service';
import { Event } from '../event/entities/event.entity';

interface SearchFilters {
  city?: string;
  categories?: string[];
  startDate?: string;
  endDate?: string;
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
  status?: string;
  organizerName?: string;
}

interface SearchResult {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class HybridSearchService {
  private client: QdrantClient;
  private readonly scoreThreshold = 0.3;

  constructor(
    private configService: ConfigService,
    private embeddingService: EmbeddingService,
  ) {
    this.client = createQdrantClient(this.configService);
  }

  async searchEvents(
    query?: string,
    filters: SearchFilters = {},
    limit: number = 15,
    page: number = 1,
  ): Promise<SearchResult> {
    const offset = (page - 1) * limit;

    // Build query filter
    const queryFilter = this.buildQueryFilter(filters);

    console.log(`Search request: query="${query}", filters=`, filters);
    console.log(`Built query filter:`, JSON.stringify(queryFilter, null, 2));

    let searchResult;

    if (query && query.trim()) {
      // Semantic search with query text
      console.log('Performing semantic search with query:', query);
      const embedding = await this.embeddingService.generateEmbedding(query);

      searchResult = await this.client.search(EVENTS_COLLECTION_NAME, {
        vector: {
          name: VECTOR_NAME,
          vector: embedding,
        },
        filter: queryFilter,
        limit,
        offset,
        with_payload: true,
        score_threshold: this.scoreThreshold,
      });

      console.log(`Semantic search returned ${searchResult.length} results`);
    } else {
      // Filter-only search (no semantic query)
      console.log('Performing filter-only search');
      const scrollResult = await this.client.scroll(EVENTS_COLLECTION_NAME, {
        filter: queryFilter,
        limit,
        offset,
        with_payload: true,
      });

      console.log(
        'Scroll result structure:',
        typeof scrollResult,
        Object.keys(scrollResult || {}),
      );

      // Handle different Qdrant client versions
      let points;
      if (scrollResult && 'points' in scrollResult) {
        points = (scrollResult as any).points;
      } else if (Array.isArray(scrollResult)) {
        points = scrollResult;
      } else {
        console.log('Unexpected scroll result format:', scrollResult);
        points = [];
      }

      console.log(`Filter-only search returned ${points.length} points`);

      // Convert scroll result to search result format
      searchResult = points.map((point) => ({
        id: point.id,
        score: 1.0, // No score for filter-only
        payload: point.payload,
      }));
    }

    // Convert results to Event objects
    const events = searchResult.map((hit) =>
      this.convertPayloadToEvent(hit.payload as any),
    );

    console.log(`Converted to ${events.length} events`);

    return {
      events,
      total: events.length, // Note: This is approximate for semantic search
      page,
      limit,
    };
  }

  async searchByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    query?: string,
    filters: SearchFilters = {},
    limit: number = 15,
    page: number = 1,
  ): Promise<SearchResult> {
    // Add geo bounding box to filters
    const radiusDegrees = radiusKm / 111.32; // Rough conversion
    const geoFilters = {
      ...filters,
      minLat: latitude - radiusDegrees,
      maxLat: latitude + radiusDegrees,
      minLon: longitude - radiusDegrees,
      maxLon: longitude + radiusDegrees,
    };

    return this.searchEvents(query, geoFilters, limit, page);
  }

  private buildQueryFilter(filters: SearchFilters): any {
    const conditions: any[] = [];

    // Categories filter
    if (filters.categories && filters.categories.length > 0) {
      conditions.push({
        key: 'categories',
        match: { any: filters.categories.map((cat) => cat.toLowerCase()) },
      });
    }

    // Status filter
    if (filters.status) {
      conditions.push({
        key: 'status',
        match: { value: filters.status },
      });
    }

    // Organizer filter
    if (filters.organizerName) {
      conditions.push({
        key: 'organizerName',
        match: { value: filters.organizerName },
      });
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      const dateRange: any = {};

      if (filters.startDate) {
        const startTimestamp = new Date(filters.startDate).getTime() / 1000;
        dateRange.gte = startTimestamp;
      }

      if (filters.endDate) {
        const endTimestamp = new Date(filters.endDate).getTime() / 1000;
        dateRange.lte = endTimestamp;
      }

      conditions.push({
        key: 'startTime',
        range: dateRange,
      });
    }

    // Geo bounding box filter - following Python implementation pattern
    if (filters.minLat && filters.maxLat && filters.minLon && filters.maxLon) {
      const geoCondition = {
        key: 'geoLocation',
        geo_bounding_box: {
          top_left: {
            lat: filters.maxLat,
            lon: filters.minLon,
          },
          bottom_right: {
            lat: filters.minLat,
            lon: filters.maxLon,
          },
        },
      };

      conditions.push(geoCondition);
      console.log(
        'Added geo condition:',
        JSON.stringify(geoCondition, null, 2),
      );
    }

    const finalFilter =
      conditions.length > 0 ? { must: conditions } : undefined;
    console.log('Final filter conditions count:', conditions.length);

    return finalFilter;
  }

  private convertPayloadToEvent(payload: any): Event {
    return {
      id: payload.id,
      name: payload.name || payload.eventName,
      description: payload.description || payload.eventDescription,
      location: payload.location || payload.formattedAddress,
      latitude: payload.latitude,
      longitude: payload.longitude,
      placeId: payload.placeId,
      organizerName: payload.organizerName,
      date: new Date(payload.date || payload.startTime * 1000),
      logoUrl: payload.logoUrl || payload.eventLogoUrl,
      bannerUrl: payload.bannerUrl,
      categories: payload.categories || [],
      totalTickets: payload.totalTickets || 0,
      availableTickets: payload.availableTickets || 0,
      status: payload.status || 'published',
      createdAt: new Date(payload.createdAt),
      updatedAt: new Date(payload.updatedAt || payload.createdAt),
    } as Event;
  }

  // Get event by ID from Qdrant
  async getEventById(eventId: string): Promise<Event | null> {
    try {
      const result = await this.client.scroll(EVENTS_COLLECTION_NAME, {
        filter: {
          must: [{ key: 'id', match: { value: eventId } }],
        },
        limit: 1,
        with_payload: true,
      });

      // Handle different result formats
      let points;
      if (result && 'points' in result) {
        points = (result as any).points;
      } else if (Array.isArray(result)) {
        points = result;
      } else {
        points = [];
      }

      if (points && points.length > 0) {
        return this.convertPayloadToEvent(points[0].payload as any);
      }

      return null;
    } catch (error) {
      console.error('Error getting event by ID from Qdrant:', error);
      return null;
    }
  }
}
