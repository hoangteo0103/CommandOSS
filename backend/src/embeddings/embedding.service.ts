import { Injectable, OnModuleInit } from '@nestjs/common';
import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';
import { EMBEDDING_MODEL } from '../config/qdrant.config';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private embeddingPipeline: FeatureExtractionPipeline;

  async onModuleInit() {
    try {
      console.log('Initializing embedding model...');
      this.embeddingPipeline = (await pipeline(
        'feature-extraction',
        EMBEDDING_MODEL,
      )) as FeatureExtractionPipeline;
      console.log('Embedding model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize embedding model:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingPipeline) {
      throw new Error('Embedding pipeline not initialized');
    }

    try {
      // Clean and prepare text
      const cleanText = text.trim();
      if (!cleanText) {
        throw new Error('Empty text provided for embedding');
      }

      // Generate embedding
      const output = await this.embeddingPipeline(cleanText, {
        pooling: 'mean',
        normalize: true,
      });

      // Extract the embedding array
      const embedding = Array.from(output.data) as number[];

      if (embedding.length === 0) {
        throw new Error('Failed to generate embedding');
      }

      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  async generateMultipleEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map((text) => this.generateEmbedding(text)),
    );
    return embeddings;
  }
}
