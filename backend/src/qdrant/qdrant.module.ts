import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QdrantService } from './qdrant.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [ConfigModule, SearchModule],
  providers: [QdrantService],
  exports: [QdrantService],
})
export class QdrantModule {}
