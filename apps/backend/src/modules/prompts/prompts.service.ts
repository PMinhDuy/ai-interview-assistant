import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PromptsRepository } from './prompts.repository';
import { PromptEngineService } from './prompt-engine.service';
import type { CreatePromptDto, UpdatePromptDto } from './dto/prompt.dto';

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);

  constructor(
    private readonly promptsRepo: PromptsRepository,
    private readonly promptEngine: PromptEngineService,
  ) {}

  async createPrompt(dto: CreatePromptDto) {
    const highestVersion = await this.promptsRepo.findHighestVersion(dto.name);

    if (highestVersion > 0) {
      // If it exists, default to incrementing version. User should use update API
      // but if they call create, we automatically handle it as a new version.
      return this.createNextVersion(dto.name, highestVersion, {
        template: dto.template,
        description: dto.description,
        variables: dto.variables,
      });
    }

    const prompt = await this.promptsRepo.createPrompt({
      name: dto.name,
      version: 1,
      description: dto.description,
      template: dto.template,
      variables: dto.variables,
      isActive: true,
    });

    this.logger.log(`Created prompt template: ${dto.name} (v1)`);
    return prompt;
  }

  async updatePrompt(name: string, dto: UpdatePromptDto) {
    const highestVersion = await this.promptsRepo.findHighestVersion(name);
    if (highestVersion === 0) {
      throw new NotFoundException(`Prompt template with name "${name}" not found`);
    }

    // Get the highest version details to inherit unchanged fields
    const latest = await this.promptsRepo.findByNameAndVersion(name, highestVersion);
    if (!latest) throw new NotFoundException('Latest prompt version not found');

    return this.createNextVersion(name, highestVersion, {
      template: dto.template ?? latest.template,
      description: dto.description ?? latest.description ?? undefined,
      variables: dto.variables ?? latest.variables,
    });
  }

  async getPrompt(name: string, version?: number) {
    const prompt = version
      ? await this.promptsRepo.findByNameAndVersion(name, version)
      : await this.promptsRepo.findActiveByName(name);

    if (!prompt) {
      throw new NotFoundException(
        `Prompt template "${name}"${version ? ` (v${version})` : ' (active)'} not found`,
      );
    }
    return prompt;
  }

  async compilePrompt(name: string, values: Record<string, string>, version?: number): Promise<string> {
    const prompt = await this.getPrompt(name, version);
    return this.promptEngine.compile(prompt.template, prompt.variables, values);
  }

  async setActiveVersion(name: string, version: number) {
    const exists = await this.promptsRepo.findByNameAndVersion(name, version);
    if (!exists) {
      throw new NotFoundException(`Prompt "${name}" version ${version} not found`);
    }

    const prompt = await this.promptsRepo.setVersionActive(name, version);
    this.logger.log(`Set prompt active version: ${name} (v${version})`);
    return prompt;
  }

  async listAllLatest() {
    return this.promptsRepo.findAllLatest();
  }

  async listAllVersions(name: string) {
    const versions = await this.promptsRepo.findAllVersions(name);
    if (versions.length === 0) {
      throw new NotFoundException(`Prompt template "${name}" not found`);
    }
    return versions;
  }

  async deleteVersion(name: string, version: number): Promise<void> {
    const exists = await this.promptsRepo.findByNameAndVersion(name, version);
    if (!exists) {
      throw new NotFoundException(`Prompt "${name}" version ${version} not found`);
    }

    if (exists.isActive) {
      throw new BadRequestException('Cannot delete an active prompt template version');
    }

    await this.promptsRepo.deleteVersion(name, version);
    this.logger.log(`Deleted prompt version: ${name} (v${version})`);
  }

  // ── Private Helpers ──────────────────────────────────────────

  private async createNextVersion(
    name: string,
    highestVersion: number,
    data: { template: string; description?: string; variables: string[] },
  ) {
    const nextVersion = highestVersion + 1;
    const prompt = await this.promptsRepo.createPrompt({
      name,
      version: nextVersion,
      description: data.description,
      template: data.template,
      variables: data.variables,
      isActive: true, // Automatically activate the newest version
    });

    this.logger.log(`Created prompt template version: ${name} (v${nextVersion})`);
    return prompt;
  }
}
