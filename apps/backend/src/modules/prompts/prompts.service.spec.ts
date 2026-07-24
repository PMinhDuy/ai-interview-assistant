import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { PromptsRepository } from './prompts.repository';
import { PromptEngineService } from './prompt-engine.service';

const mockPromptsRepository = {
  findActiveByName: jest.fn(),
  findByNameAndVersion: jest.fn(),
  findHighestVersion: jest.fn(),
  createPrompt: jest.fn(),
  setVersionActive: jest.fn(),
  findAllVersions: jest.fn(),
  findAllLatest: jest.fn(),
  deleteVersion: jest.fn(),
};

const mockPromptEngineService = {
  compile: jest.fn(),
};

describe('PromptsService', () => {
  let service: PromptsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptsService,
        { provide: PromptsRepository, useValue: mockPromptsRepository },
        { provide: PromptEngineService, useValue: mockPromptEngineService },
      ],
    }).compile();

    service = module.get<PromptsService>(PromptsService);
    jest.clearAllMocks();
  });

  describe('createPrompt', () => {
    it('should create version 1 if prompt name does not exist', async () => {
      mockPromptsRepository.findHighestVersion.mockResolvedValue(0);
      mockPromptsRepository.createPrompt.mockResolvedValue({ id: '1', version: 1 });

      const dto = {
        name: 'test-prompt',
        template: 'content',
        variables: [],
      };

      const result = await service.createPrompt(dto);

      expect(mockPromptsRepository.findHighestVersion).toHaveBeenCalledWith('test-prompt');
      expect(mockPromptsRepository.createPrompt).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'test-prompt', version: 1 })
      );
      expect(result.version).toBe(1);
    });

    it('should create version increment if prompt name already exists', async () => {
      mockPromptsRepository.findHighestVersion.mockResolvedValue(2);
      mockPromptsRepository.createPrompt.mockResolvedValue({ id: '2', version: 3 });

      const dto = {
        name: 'test-prompt',
        template: 'content',
        variables: [],
      };

      const result = await service.createPrompt(dto);

      expect(mockPromptsRepository.createPrompt).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'test-prompt', version: 3 })
      );
      expect(result.version).toBe(3);
    });
  });

  describe('updatePrompt', () => {
    it('should throw NotFoundException if prompt name is not found', async () => {
      mockPromptsRepository.findHighestVersion.mockResolvedValue(0);

      await expect(
        service.updatePrompt('test-prompt', { template: 'new content' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should successfully inherit values and create incremented version', async () => {
      mockPromptsRepository.findHighestVersion.mockResolvedValue(1);
      mockPromptsRepository.findByNameAndVersion.mockResolvedValue({
        name: 'test-prompt',
        version: 1,
        template: 'old content',
        description: 'old desc',
        variables: ['old'],
      });
      mockPromptsRepository.createPrompt.mockResolvedValue({ id: '2', version: 2 });

      const result = await service.updatePrompt('test-prompt', {
        template: 'new content',
      });

      expect(mockPromptsRepository.createPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-prompt',
          version: 2,
          template: 'new content',
          description: 'old desc',
          variables: ['old'],
        })
      );
      expect(result.version).toBe(2);
    });
  });

  describe('deleteVersion', () => {
    it('should throw BadRequestException if version is active', async () => {
      mockPromptsRepository.findByNameAndVersion.mockResolvedValue({
        name: 'test',
        version: 1,
        isActive: true,
      });

      await expect(service.deleteVersion('test', 1)).rejects.toThrow(BadRequestException);
    });

    it('should delete version if it is inactive', async () => {
      mockPromptsRepository.findByNameAndVersion.mockResolvedValue({
        name: 'test',
        version: 1,
        isActive: false,
      });

      await service.deleteVersion('test', 1);

      expect(mockPromptsRepository.deleteVersion).toHaveBeenCalledWith('test', 1);
    });
  });
});
