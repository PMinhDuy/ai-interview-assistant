import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { CurrentQuestionResponse } from './types';

export const getCurrentQuestion = async (id: string): Promise<CurrentQuestionResponse> => {
  const { data } = await apiClient.get<CurrentQuestionResponse>(`/interviews/${id}/questions/current`);
  return data;
};

export const getCurrentQuestionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['current-question', id],
    queryFn: () => getCurrentQuestion(id),
    enabled: Boolean(id),
  });
