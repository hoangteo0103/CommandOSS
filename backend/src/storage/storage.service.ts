import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateStorageDto } from './dto/update-storage.dto';
import { createStorage, createStorageConfig } from '../config/storage.config';
import { format } from 'date-fns';

@Injectable()
export class StorageService {
  private storage;
  private bucket;
  private config;

  constructor(private configService: ConfigService) {
    this.config = createStorageConfig(this.configService);
    this.storage = createStorage(this.configService);

    console.log('Storage config loaded:', {
      projectId: this.config.projectId,
      bucketName: this.config.bucketName,
      keyFilename: this.config.keyFilename,
    });

    if (!this.config.bucketName) {
      throw new Error('GCS_BUCKET_NAME environment variable is required');
    }

    this.bucket = this.storage.bucket(this.config.bucketName);
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      if (!this.config.bucketName) {
        throw new BadRequestException('GCS bucket name not configured');
      }

      console.log('Received file for upload:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      // Generate a unique filename with timestamp.
      const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
      const fileExtension = file.originalname.split('.').pop();
      const baseName = file.originalname.split('.').slice(0, -1).join('.');
      const uniqueFilename = `${timestamp}-${baseName.replace(/[^a-zA-Z0-9.-]/g, '_')}.${fileExtension}`;

      // Create a file object in the bucket.
      const blob = this.bucket.file(uniqueFilename);

      // Create a stream to upload the file with public read permissions
      const stream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          cacheControl: 'public, max-age=3600',
        },
        public: true, // Make file publicly readable during upload
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          console.error('Upload stream error:', error);
          reject(
            new BadRequestException(`Failed to upload file: ${error.message}`),
          );
        });

        console.log('storage config', this.config);

        stream.on('finish', async () => {
          try {
            // Try to make the file publicly accessible (fallback)
            try {
              await blob.makePublic();
              console.log('File made public via makePublic()');
            } catch (publicError) {
              console.warn(
                'Could not make file public via makePublic(), trying ACL:',
                publicError.message,
              );

              // Fallback: Set ACL directly
              try {
                await blob.acl.add({
                  entity: 'allUsers',
                  role: 'READER',
                });
                console.log('File made public via ACL');
              } catch (aclError) {
                console.error('Failed to set public ACL:', aclError.message);
                // Continue anyway - the file might still be accessible if bucket has public policy
              }
            }

            // Generate the public URL.
            const publicUrl = `https://storage.googleapis.com/${this.config.bucketName}/${uniqueFilename}`;

            console.log('File uploaded and made public successfully:', {
              filename: uniqueFilename,
              url: publicUrl,
            });

            resolve(publicUrl);
          } catch (error) {
            console.error('Error after upload:', error);
            reject(
              new BadRequestException(
                `Failed to process uploaded file: ${error.message}`,
              ),
            );
          }
        });

        // Write the file buffer to the stream.
        stream.end(file.buffer);
      });
    } catch (error) {
      console.error('Upload error in service:', error);
      throw new BadRequestException(
        error.message || 'Failed to upload file to Google Cloud Storage',
      );
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const file = this.bucket.file(filename);

      // Check if file exists.
      const [exists] = await file.exists();

      if (exists) {
        await file.delete();
        console.log('File deleted from GCS:', filename);
      } else {
        console.warn('File not found in GCS for deletion:', filename);
      }
    } catch (error) {
      console.error('Delete error in service:', error);
      throw new BadRequestException(
        error.message || 'Failed to delete file from Google Cloud Storage',
      );
    }
  }
}
