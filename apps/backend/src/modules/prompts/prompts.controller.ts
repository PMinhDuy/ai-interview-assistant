import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { PromptsService } from './prompts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import {
  CreatePromptDto,
  UpdatePromptDto,
  CompilePromptDto,
  PromptResponseDto,
} from './dto/prompt.dto';

@ApiTags('prompts')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'prompts', version: '1' })
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create prompt template (ADMIN)',
    description: 'Registers a new prompt template. If name already exists, increments version.',
  })
  @ApiResponse({ status: 201, type: PromptResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin only)' })
  createPrompt(@Body() dto: CreatePromptDto) {
    return this.promptsService.createPrompt(dto);
  }

  @Put(':name')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update prompt template (ADMIN)',
    description: 'Creates a new version of the prompt template with incremented version number.',
  })
  @ApiResponse({ status: 200, type: PromptResponseDto })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  updatePrompt(@Param('name') name: string, @Body() dto: UpdatePromptDto) {
    return this.promptsService.updatePrompt(name, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List latest versions of all prompt templates',
    description: 'Returns the active or latest version of each unique prompt template.',
  })
  @ApiResponse({ status: 200, type: [PromptResponseDto] })
  listLatest() {
    return this.promptsService.listAllLatest();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get active version of a prompt template' })
  @ApiResponse({ status: 200, type: PromptResponseDto })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  getPromptActive(@Param('name') name: string) {
    return this.promptsService.getPrompt(name);
  }

  @Get(':name/versions')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all versions of a prompt template (ADMIN)' })
  @ApiResponse({ status: 200, type: [PromptResponseDto] })
  listVersions(@Param('name') name: string) {
    return this.promptsService.listAllVersions(name);
  }

  @Get(':name/version/:version')
  @ApiOperation({ summary: 'Get specific version of a prompt template' })
  @ApiParam({ name: 'version', type: Number })
  @ApiResponse({ status: 200, type: PromptResponseDto })
  @ApiResponse({ status: 404, description: 'Prompt version not found' })
  getPromptVersion(
    @Param('name') name: string,
    @Param('version', ParseIntPipe) version: number,
  ) {
    return this.promptsService.getPrompt(name, version);
  }

  @Patch(':name/activate/:version')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'version', type: Number })
  @ApiOperation({ summary: 'Set specific prompt version as active (ADMIN)' })
  @ApiResponse({ status: 200, type: PromptResponseDto })
  setActive(
    @Param('name') name: string,
    @Param('version', ParseIntPipe) version: number,
  ) {
    return this.promptsService.setActiveVersion(name, version);
  }

  @Post(':name/compile')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'version', required: false, type: Number })
  @ApiOperation({
    summary: 'Compile a prompt template with variables',
    description: 'Substitutes placeholders with the provided variables. Optionally specify version.',
  })
  @ApiResponse({ status: 200, description: 'Compiled prompt text string' })
  @ApiResponse({ status: 400, description: 'Missing required variables' })
  async compilePrompt(
    @Param('name') name: string,
    @Body() dto: CompilePromptDto,
    @Query('version') version?: string,
  ) {
    const vNum = version ? parseInt(version, 10) : undefined;
    const text = await this.promptsService.compilePrompt(name, dto.variables, vNum);
    return { compiledText: text };
  }

  @Delete(':name/version/:version')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'version', type: Number })
  @ApiOperation({
    summary: 'Delete specific inactive version of a prompt (ADMIN)',
    description: 'Removes the template version. Active versions cannot be deleted.',
  })
  @ApiResponse({ status: 204, description: 'Prompt version deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete active version' })
  async deleteVersion(
    @Param('name') name: string,
    @Param('version', ParseIntPipe) version: number,
  ): Promise<void> {
    await this.promptsService.deleteVersion(name, version);
  }
}
