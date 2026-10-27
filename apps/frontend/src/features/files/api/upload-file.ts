import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { UploadFileParams } from './types';
import { getResumesQueryOptions } from './get-resumes';
import { getJobDescriptionsQueryOptions } from './get-job-descriptions';

export const uploadFile = async ({ file, type }: UploadFileParams) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const { data } = await apiClient.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const useUploadFileMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadFile,
    onSuccess: (_, variables) => {
      if (variables.type === 'RESUME') {
        queryClient.invalidateQueries(getResumesQueryOptions());
      } else {
        queryClient.invalidateQueries(getJobDescriptionsQueryOptions());
      }
      onSuccessCallback?.();
    },
  });
};
