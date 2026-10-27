import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { JobDescriptionItem } from './types';

export const getJobDescriptions = async (): Promise<JobDescriptionItem[]> => {
  const { data } = await apiClient.get<JobDescriptionItem[]>('/job-descriptions');
  return data;
};

export const getJobDescriptionsQueryOptions = () =>
  queryOptions({
    queryKey: ['job-descriptions'],
    queryFn: getJobDescriptions,
  });
