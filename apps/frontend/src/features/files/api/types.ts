export type FileCategory = 'RESUME' | 'JOB_DESCRIPTION';

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

export interface UploadFileParams {
  file: File;
  type: FileCategory;
}
