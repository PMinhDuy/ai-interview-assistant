import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { ResumeRepository } from './resume.repository';

@Module({
  controllers: [ResumesController],
  providers: [ResumesService, ResumeRepository],
  exports: [ResumesService], // exported for use in InterviewsModule (Phase 6)
})
export class ResumesModule {}
