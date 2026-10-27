import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { SubmitAnswerResponse } from './types';
import { getSessionQueryOptions } from './get-session';
import { getCurrentQuestionQueryOptions } from './get-current-question';

export interface SubmitAnswerParams {
  sessionId: string;
  questionId: string;
  userAnswer: string;
}

export const submitAnswer = async ({
  sessionId,
  questionId,
  userAnswer,
}: SubmitAnswerParams): Promise<SubmitAnswerResponse> => {
  const { data } = await apiClient.post<SubmitAnswerResponse>(`/interviews/${sessionId}/answers`, {
    questionId,
    userAnswer,
  });
  return data;
};

export const useSubmitAnswerMutation = (sessionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitAnswer,
    onSuccess: () => {
      queryClient.invalidateQueries(getSessionQueryOptions(sessionId));
      queryClient.invalidateQueries(getCurrentQuestionQueryOptions(sessionId));
    },
  });
};
