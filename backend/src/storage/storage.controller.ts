import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/i }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      console.log('Uploading file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      const url = await this.storageService.uploadFile(file);
      return {
        success: true,
        data: { url },
        message: 'File uploaded successfully',
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Delete('file/:filename')
  async deleteFile(@Param('filename') filename: string) {
    try {
      await this.storageService.deleteFile(filename);
      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('Delete error:', error);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }
}
