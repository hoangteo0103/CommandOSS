import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigService } from '@nestjs/config';

export const createQdrantClient = (
  configService: ConfigService,
): QdrantClient => {
  const qdrantUrl =
    configService.get<string>('QDRANT_URL') || 'http://localhost:6333';
  const qdrantApiKey = configService.get<string>('QDRANT_API_KEY');

  const client = new QdrantClient({
    url: qdrantUrl,
    apiKey: qdrantApiKey,
  });

  return client;
};

export const EVENTS_COLLECTION_NAME = 'events';
export const VECTOR_NAME = 'dense';
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_SIZE = 384; // MiniLM L6 v2 embedding size

export const createEventsCollection = async (client: QdrantClient) => {
  try {
    // Check if collection exists
    const collections = await client.getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === EVENTS_COLLECTION_NAME,
    );

    if (collectionExists) {
      // Check if geoLocation index exists
      try {
        // Try to create the missing geoLocation index
        await client.createPayloadIndex(EVENTS_COLLECTION_NAME, {
          field_name: 'geoLocation',
          field_schema: 'geo',
        });
        console.log(`Created missing geo index for 'geoLocation'`);
      } catch (error) {
        if (error.message?.includes('already exists')) {
          console.log(`Geo index for 'geoLocation' already exists`);
        } else {
          console.log(
            `Failed to create geo index, recreating collection:`,
            error.message,
          );
          // Delete and recreate collection with proper indexing
          await client.deleteCollection(EVENTS_COLLECTION_NAME);
          await createNewEventsCollection(client);
          return;
        }
      }
      console.log(
        `Qdrant collection ${EVENTS_COLLECTION_NAME} already exists with proper indexing`,
      );
    } else {
      await createNewEventsCollection(client);
    }
  } catch (error) {
    console.error('Error creating Qdrant collection:', error);
    throw error;
  }
};

const createNewEventsCollection = async (client: QdrantClient) => {
  // Create collection for events with proper semantic search setup
  await client.createCollection(EVENTS_COLLECTION_NAME, {
    vectors: {
      [VECTOR_NAME]: {
        size: EMBEDDING_SIZE,
        distance: 'Cosine',
      },
    },
    optimizers_config: {
      default_segment_number: 2,
    },
    replication_factor: 1,
  });

  console.log(`Created Qdrant collection: ${EVENTS_COLLECTION_NAME}`);

  // Create payload indexes for efficient filtering
  const indexFields = [
    { field: 'categories', schema: 'keyword' as const },
    { field: 'startTime', schema: 'float' as const },
    { field: 'text', schema: 'text' as const }, // For BM25 search support
    { field: 'geoLocation', schema: 'geo' as const }, // For geo bounding box queries
    { field: 'status', schema: 'keyword' as const },
    { field: 'organizerName', schema: 'keyword' as const },
  ];

  for (const { field, schema } of indexFields) {
    try {
      await client.createPayloadIndex(EVENTS_COLLECTION_NAME, {
        field_name: field,
        field_schema: schema,
      });
      console.log(`Created index for '${field}' (${schema})`);
    } catch (error) {
      console.log(`Index for '${field}' might already exist:`, error.message);
    }
  }
};
