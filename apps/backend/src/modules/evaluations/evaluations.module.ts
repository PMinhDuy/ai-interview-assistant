import { Module } from '@nestjs/common';
import { EvaluationsService } from './services/evaluations.service';
import { EvaluationsRepository } from './repositories/evaluations.repository';
import { EvaluationsController } from './evaluations.controller';
import { AIModule } from '../../infrastructure/ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [EvaluationsController],
  providers: [EvaluationsService, EvaluationsRepository],
  exports: [EvaluationsService, EvaluationsRepository],
})
export class EvaluationsModule {}
