import { Global, Module } from '@nestjs/common';
import { FileProcessorService } from './file-processor.service';

@Global()
@Module({
  providers: [FileProcessorService],
  exports: [FileProcessorService],
})
export class FileModule {}
