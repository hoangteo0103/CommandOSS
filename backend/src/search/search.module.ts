import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmbeddingService } from '../embeddings/embedding.service';
import { HybridSearchService } from './hybrid-search.service';

@Module({
  imports: [ConfigModule],
  providers: [EmbeddingService, HybridSearchService],
  exports: [EmbeddingService, HybridSearchService],
})
export class SearchModule {}
