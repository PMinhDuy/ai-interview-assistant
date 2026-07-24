import { Module } from '@nestjs/common';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { PromptEngineService } from './prompt-engine.service';
import { PromptsRepository } from './prompts.repository';

@Module({
  controllers: [PromptsController],
  providers: [PromptsService, PromptEngineService, PromptsRepository],
  exports: [PromptsService, PromptEngineService], // exported for AI orchestration in evaluation/interviews
})
export class PromptsModule {}
