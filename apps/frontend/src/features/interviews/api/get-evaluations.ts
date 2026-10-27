import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { EvaluationItem } from './types';

export const getEvaluationsBySession = async (sessionId: string): Promise<EvaluationItem[]> => {
  const { data } = await apiClient.get<EvaluationItem[]>(`/evaluations/sessions/${sessionId}`);
  return data;
};

export const getEvaluationsBySessionQueryOptions = (sessionId: string) =>
  queryOptions({
    queryKey: ['session-evaluations', sessionId],
    queryFn: () => getEvaluationsBySession(sessionId),
    enabled: Boolean(sessionId),
  });
