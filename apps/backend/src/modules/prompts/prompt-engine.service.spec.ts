import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PromptEngineService } from './prompt-engine.service';

describe('PromptEngineService', () => {
  let service: PromptEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptEngineService],
    }).compile();

    service = module.get<PromptEngineService>(PromptEngineService);
  });

  describe('compile', () => {
    it('should successfully compile a template by substituting variables', () => {
      const template = 'Hello {{name}}! Welcome to {{company}}.';
      const required = ['name', 'company'];
      const values = { name: 'Duy', company: 'Personal' };

      const result = service.compile(template, required, values);

      expect(result).toBe('Hello Duy! Welcome to Personal.');
    });

    it('should ignore spacing inside placeholder braces', () => {
      const template = 'Hello {{  name  }}! Welcome to {{company}}.';
      const required = ['name', 'company'];
      const values = { name: 'Duy', company: 'Personal' };

      const result = service.compile(template, required, values);

      expect(result).toBe('Hello Duy! Welcome to Personal.');
    });

    it('should throw BadRequestException if a required variable is missing', () => {
      const template = 'Hello {{name}}! Welcome to {{company}}.';
      const required = ['name', 'company'];
      const values = { name: 'Duy' }; // missing 'company'

      expect(() => {
        service.compile(template, required, values as Record<string, string>);
      }).toThrow(BadRequestException);
    });

    it('should retain a placeholder if it is not in the required variables list and not supplied', () => {
      const template = 'Hello {{name}}! Welcome to {{company}} and {{other_val}}.';
      const required = ['name', 'company']; // 'other_val' is not required
      const values = { name: 'Duy', company: 'Personal' };

      const result = service.compile(template, required, values);

      expect(result).toBe('Hello Duy! Welcome to Personal and {{other_val}}.');
    });
  });
});
