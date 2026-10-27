import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { getJobDescriptionsQueryOptions } from './get-job-descriptions';

export const deleteJobDescription = async (id: string): Promise<void> => {
  await apiClient.delete(`/job-descriptions/${id}`);
};

export const useDeleteJobDescriptionMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteJobDescription,
    onSuccess: () => {
      queryClient.invalidateQueries(getJobDescriptionsQueryOptions());
      onSuccessCallback?.();
    },
  });
};
