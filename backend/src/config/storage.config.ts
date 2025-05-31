import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';

// For direct access (fallback).
export const storageConfig = {
  projectId: process.env.GCP_PROJECT_ID,
  bucketName: process.env.GCS_BUCKET_NAME,
  keyFilename: process.env.GCS_KEY_FILE,
};

// Factory function for ConfigService-based configuration.
export const createStorageConfig = (configService: ConfigService) => ({
  projectId: configService.get<string>('GCP_PROJECT_ID'),
  bucketName: configService.get<string>('GCS_BUCKET_NAME'),
  keyFilename: configService.get<string>('GCS_KEY_FILE'),
});

// Factory function for Storage instance.
export const createStorage = (configService: ConfigService) => {
  const config = createStorageConfig(configService);
  return new Storage({
    projectId: config.projectId,
    keyFilename: config.keyFilename,
  });
};

// Default storage instance (for backward compatibility).
export const storage = new Storage({
  projectId: storageConfig.projectId,
  keyFilename: storageConfig.keyFilename,
});
