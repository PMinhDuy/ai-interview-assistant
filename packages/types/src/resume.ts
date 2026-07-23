// ── Resume types ─────────────────────────────────────────────

export type ResumeStatus = 'PENDING' | 'PROCESSING' | 'ANALYZED' | 'FAILED';

export type Resume = {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  fileUrl?: string;
  extractedText?: string;
  status: ResumeStatus;
  metadata?: ResumeMetadata;
  createdAt: string;
  updatedAt: string;
};

export type ResumeMetadata = {
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  languages?: string[];
  certifications?: string[];
};

export type WorkExperience = {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  technologies?: string[];
};

export type Education = {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
};

export type ResumeAnalysis = {
  resumeId: string;
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  suggestions: string[];
  keywordDensity: Record<string, number>;
  readabilityScore: number;
  analyzedAt: string;
};
