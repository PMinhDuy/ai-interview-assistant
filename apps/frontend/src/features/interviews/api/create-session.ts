import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { CreateInterviewSessionDto, InterviewSession } from './types';
import { getSessionsQueryOptions } from './get-sessions';

export const createSession = async (dto: CreateInterviewSessionDto): Promise<InterviewSession> => {
  const { data } = await apiClient.post<InterviewSession>('/interviews', dto);
  return data;
};

export const useCreateSessionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries(getSessionsQueryOptions());
    },
  });
};
