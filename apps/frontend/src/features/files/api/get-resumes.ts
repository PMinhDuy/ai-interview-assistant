import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ResumeItem } from './types';

export const getResumes = async (): Promise<ResumeItem[]> => {
  const { data } = await apiClient.get<ResumeItem[]>('/resumes');
  return data;
};

export const getResumesQueryOptions = () =>
  queryOptions({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });
