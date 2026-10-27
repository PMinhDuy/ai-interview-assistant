export interface PromptTemplateItem {
  id: string;
  name: string;
  version: number;
  template: string;
  description?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CreatePromptDto {
  name: string;
  template: string;
  description?: string;
  variables?: string[];
}

export interface UpdatePromptDto {
  template: string;
  description?: string;
  variables?: string[];
}

export interface CompilePromptParams {
  name: string;
  variables: Record<string, string>;
  version?: number;
}
