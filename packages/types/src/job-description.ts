// ── Job Description types ────────────────────────────────────

export type JobDescription = {
  id: string;
  userId: string;
  title: string;
  company?: string;
  filename?: string;
  extractedText: string;
  requirements: string[];
  niceToHave: string[];
  techStack: string[];
  experienceLevel: ExperienceLevel;
  createdAt: string;
  updatedAt: string;
};

export type ExperienceLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'STAFF';

export type CreateJobDescriptionRequest = {
  title: string;
  company?: string;
  rawText?: string;
};
