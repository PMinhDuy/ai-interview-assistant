import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { InterviewSession } from './types';

export const getSession = async (id: string): Promise<InterviewSession> => {
  const { data } = await apiClient.get<InterviewSession>(`/interviews/${id}`);
  return data;
};

export const getSessionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['session', id],
    queryFn: () => getSession(id),
    enabled: Boolean(id),
  });
