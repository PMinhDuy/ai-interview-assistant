import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { PromptTemplateItem } from './types';

export const getLatestPrompts = async (): Promise<PromptTemplateItem[]> => {
  const { data } = await apiClient.get<PromptTemplateItem[]>('/prompts');
  return data;
};

export const getLatestPromptsQueryOptions = (enabled = true) =>
  queryOptions({
    queryKey: ['prompts'],
    queryFn: getLatestPrompts,
    enabled,
  });

export const getPromptVersions = async (name: string): Promise<PromptTemplateItem[]> => {
  const { data } = await apiClient.get<PromptTemplateItem[]>(`/prompts/${name}/versions`);
  return data;
};

export const getPromptVersionsQueryOptions = (name: string) =>
  queryOptions({
    queryKey: ['prompt-versions', name],
    queryFn: () => getPromptVersions(name),
    enabled: Boolean(name),
  });
