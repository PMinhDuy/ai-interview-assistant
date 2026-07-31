import { apiClient } from '../lib/axios';

export interface PromptTemplateItem {
  id: string;
  name: string;
  version: number;
  template: string;
  description?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CreatePromptDto {
  name: string;
  template: string;
  description?: string;
  variables?: string[];
}

export interface UpdatePromptDto {
  template: string;
  description?: string;
  variables?: string[];
}

export const promptsService = {
  async getLatestPrompts(): Promise<PromptTemplateItem[]> {
    const { data } = await apiClient.get<PromptTemplateItem[]>('/prompts');
    return data;
  },

  async createPrompt(dto: CreatePromptDto): Promise<PromptTemplateItem> {
    const { data } = await apiClient.post<PromptTemplateItem>('/prompts', dto);
    return data;
  },

  async updatePrompt(name: string, dto: UpdatePromptDto): Promise<PromptTemplateItem> {
    const { data } = await apiClient.put<PromptTemplateItem>(`/prompts/${name}`, dto);
    return data;
  },

  async getPromptVersions(name: string): Promise<PromptTemplateItem[]> {
    const { data } = await apiClient.get<PromptTemplateItem[]>(`/prompts/${name}/versions`);
    return data;
  },

  async setActiveVersion(name: string, version: number): Promise<PromptTemplateItem> {
    const { data } = await apiClient.patch<PromptTemplateItem>(`/prompts/${name}/activate/${version}`);
    return data;
  },

  async compilePrompt(name: string, variables: Record<string, string>, version?: number): Promise<{ compiledText: string }> {
    const { data } = await apiClient.post<{ compiledText: string }>(
      `/prompts/${name}/compile${version ? `?version=${version}` : ''}`,
      { variables },
    );
    return data;
  },
};
