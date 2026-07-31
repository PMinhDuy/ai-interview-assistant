import { apiClient } from '../lib/axios';

export interface ResumeItem {
  id: string;
  userId: string;
  originalName: string;
  fileSize: number;
  extractedText?: string;
  createdAt: string;
}

export interface JobDescriptionItem {
  id: string;
  userId: string;
  originalName: string;
  fileSize: number;
  extractedText?: string;
  createdAt: string;
}

export const filesService = {
  async uploadFile(file: File, type: 'RESUME' | 'JOB_DESCRIPTION') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const { data } = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async getResumes(): Promise<ResumeItem[]> {
    const { data } = await apiClient.get<ResumeItem[]>('/resumes');
    return data;
  },

  async deleteResume(id: string): Promise<void> {
    await apiClient.delete(`/resumes/${id}`);
  },

  async getJobDescriptions(): Promise<JobDescriptionItem[]> {
    const { data } = await apiClient.get<JobDescriptionItem[]>('/job-descriptions');
    return data;
  },

  async deleteJobDescription(id: string): Promise<void> {
    await apiClient.delete(`/job-descriptions/${id}`);
  },
};
