import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './services/interviews.service';
import { QuestionGeneratorService } from './services/question-generator.service';
import { InterviewsRepository } from './repositories/interviews.repository';
import { AIModule } from '../../infrastructure/ai/ai.module';
import { RAGModule } from '../rag/rag.module';
import { PromptsModule } from '../prompts/prompts.module';
import { ResumesModule } from '../resumes/resumes.module';
import { JobDescriptionsModule } from '../job-descriptions/job-descriptions.module';
import { EvaluationsModule } from '../evaluations/evaluations.module';

@Module({
  imports: [
    AIModule,
    RAGModule,
    PromptsModule,
    ResumesModule,
    JobDescriptionsModule,
    EvaluationsModule,
  ],
  controllers: [InterviewsController],
  providers: [
    InterviewsRepository,
    QuestionGeneratorService,
    InterviewsService,
  ],
  exports: [
    InterviewsService,
    QuestionGeneratorService,
    InterviewsRepository,
  ],
})
export class InterviewsModule {}
