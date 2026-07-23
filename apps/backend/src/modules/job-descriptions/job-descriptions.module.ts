import { Module } from '@nestjs/common';
import { JobDescriptionsController } from './job-descriptions.controller';
import { JobDescriptionsService } from './job-descriptions.service';
import { JobDescriptionRepository } from './job-description.repository';

@Module({
  controllers: [JobDescriptionsController],
  providers: [JobDescriptionsService, JobDescriptionRepository],
  exports: [JobDescriptionsService],
})
export class JobDescriptionsModule {}
