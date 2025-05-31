import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import {
  createQdrantClient,
  createEventsCollection,
  EVENTS_COLLECTION_NAME,
  VECTOR_NAME,
} from '../config/qdrant.config';
import { Event } from '../event/entities/event.entity';
import { EmbeddingService } from '../embeddings/embedding.service';

@Injectable()
export class QdrantService implements OnModuleInit {
  private client: QdrantClient;

  constructor(
    private configService: ConfigService,
    private embeddingService: EmbeddingService,
  ) {
    this.client = createQdrantClient(this.configService);
  }

  async onModuleInit() {
    try {
      await createEventsCollection(this.client);
      console.log('Qdrant service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Qdrant service:', error);
    }
  }

  async indexEvent(event: Event): Promise<void> {
    try {
      // Create content for embedding (similar to Python example)
      const content = this.createEventText(event);
      const embedding = await this.embeddingService.generateEmbedding(content);

      // Prepare location data
      const location =
        event.latitude && event.longitude
          ? { lat: event.latitude, lon: event.longitude }
          : null;

      // Create payload with proper structure
      const payload = {
        id: event.id,
        name: event.name,
        eventName: event.name, // Compatibility
        description: event.description,
        eventDescription: event.description, // Compatibility
        location: event.location, // Location string
        formattedAddress: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        placeId: event.placeId,
        organizerName: event.organizerName,
        date: event.date.toISOString(),
        startTime: event.date.getTime() / 1000, // Unix timestamp for filtering
        logoUrl: event.logoUrl,
        eventLogoUrl: event.logoUrl, // Compatibility
        bannerUrl: event.bannerUrl,
        categories: event.categories?.map((cat) => cat.toLowerCase()) || [],
        status: event.status,
        totalTickets: event.totalTickets,
        availableTickets: event.availableTickets,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        text: content, // For BM25 search support
        city: this.extractCityFromLocation(event.location),
        geoLocation: location, // Geo point for spatial queries (renamed to avoid conflict)
      };

      const point = {
        id: event.id,
        vector: {
          [VECTOR_NAME]: embedding,
        },
        payload,
      };

      await this.client.upsert(EVENTS_COLLECTION_NAME, {
        wait: true,
        points: [point],
      });

      console.log(`Event indexed in Qdrant: ${event.id}`);
    } catch (error) {
      console.error(`Failed to index event ${event.id}:`, error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.client.delete(EVENTS_COLLECTION_NAME, {
        wait: true,
        points: [eventId],
      });
      console.log(`Event deleted from Qdrant: ${eventId}`);
    } catch (error) {
      console.error(`Failed to delete event ${eventId} from Qdrant:`, error);
      throw error;
    }
  }

  // Create search text like Python example
  private createEventText(event: Event): string {
    const categories = event.categories?.join(', ') || '';
    const text = `${event.name} - ${event.description}. Located at ${event.location}. Categories: ${categories}`;
    return text;
  }

  // Extract city from location string (simple approach)
  private extractCityFromLocation(location: string): string {
    if (!location) return '';

    // Try to extract city from the end of the address
    const parts = location.split(',').map((part) => part.trim());

    // Usually city is the last or second to last part
    if (parts.length >= 2) {
      // Take the second to last part as city (last is often country)
      return parts[parts.length - 2].toLowerCase();
    } else if (parts.length === 1) {
      return parts[0].toLowerCase();
    }

    return '';
  }

  // Legacy methods for backward compatibility
  async searchEventsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20,
  ): Promise<Event[]> {
    try {
      // Use bounding box approach
      const radiusDegrees = radiusKm / 111.32;

      const searchResult = await this.client.scroll(EVENTS_COLLECTION_NAME, {
        filter: {
          must: [
            {
              key: 'geoLocation',
              geo_bounding_box: {
                top_left: {
                  lat: latitude + radiusDegrees,
                  lon: longitude - radiusDegrees,
                },
                bottom_right: {
                  lat: latitude - radiusDegrees,
                  lon: longitude + radiusDegrees,
                },
              },
            },
          ],
        },
        limit,
        with_payload: true,
      });

      // Check if searchResult is valid and has points
      if (
        !searchResult ||
        !Array.isArray(searchResult) ||
        searchResult.length === 0
      ) {
        console.log('No search results returned from Qdrant scroll');
        return [];
      }

      const points = searchResult[0];
      if (!points || !Array.isArray(points)) {
        console.log('Invalid points structure in Qdrant scroll result');
        return [];
      }

      return points.map((point) =>
        this.convertPayloadToEvent(point.payload as any),
      );
    } catch (error) {
      console.error('Failed to search events by location:', error);
      throw error;
    }
  }

  async searchEventsByContent(
    query: string,
    limit: number = 20,
  ): Promise<Event[]> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(query);

      const searchResult = await this.client.search(EVENTS_COLLECTION_NAME, {
        vector: {
          name: VECTOR_NAME,
          vector: embedding,
        },
        limit,
        with_payload: true,
        score_threshold: 0.3,
      });

      // Check if searchResult is valid
      if (!searchResult || !Array.isArray(searchResult)) {
        console.log('No search results returned from Qdrant search');
        return [];
      }

      return searchResult.map((point) =>
        this.convertPayloadToEvent(point.payload as any),
      );
    } catch (error) {
      console.error('Failed to search events by content:', error);
      throw error;
    }
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
}
