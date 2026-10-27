import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { InterviewSession } from './types';

export const getSessions = async (): Promise<InterviewSession[]> => {
  const { data } = await apiClient.get<InterviewSession[]>('/interviews');
  return data;
};

export const getSessionsQueryOptions = () =>
  queryOptions({
    queryKey: ['sessions'],
    queryFn: getSessions,
  });
