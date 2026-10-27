import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { CreatePromptDto, UpdatePromptDto, PromptTemplateItem, CompilePromptParams } from './types';
import { getLatestPromptsQueryOptions } from './get-prompts';

export const createPrompt = async (dto: CreatePromptDto): Promise<PromptTemplateItem> => {
  const { data } = await apiClient.post<PromptTemplateItem>('/prompts', dto);
  return data;
};

export const updatePrompt = async (name: string, dto: UpdatePromptDto): Promise<PromptTemplateItem> => {
  const { data } = await apiClient.put<PromptTemplateItem>(`/prompts/${name}`, dto);
  return data;
};

export const setActiveVersion = async (name: string, version: number): Promise<PromptTemplateItem> => {
  const { data } = await apiClient.patch<PromptTemplateItem>(`/prompts/${name}/activate/${version}`);
  return data;
};

export const compilePrompt = async ({
  name,
  variables,
  version,
}: CompilePromptParams): Promise<{ compiledText: string }> => {
  const { data } = await apiClient.post<{ compiledText: string }>(
    `/prompts/${name}/compile${version ? `?version=${version}` : ''}`,
    { variables },
  );
  return data;
};

export const useCreatePromptMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries(getLatestPromptsQueryOptions());
      onSuccessCallback?.();
    },
  });
};

export const useUpdatePromptMutation = (name: string, onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePromptDto) => updatePrompt(name, dto),
    onSuccess: () => {
      queryClient.invalidateQueries(getLatestPromptsQueryOptions());
      onSuccessCallback?.();
    },
  });
};

export const useActivateVersionMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, version }: { name: string; version: number }) =>
      setActiveVersion(name, version),
    onSuccess: () => {
      queryClient.invalidateQueries(getLatestPromptsQueryOptions());
      onSuccessCallback?.();
    },
  });
};
