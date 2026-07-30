import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  validateSync,
} from 'class-validator';

enum AIProvider {
  LOCAL = 'local',
  BEDROCK = 'bedrock',
  GEMINI = 'gemini',
}

enum EmbeddingProvider {
  LOCAL = 'local',
  TITAN = 'titan',
  GEMINI = 'gemini',
}

enum StorageProvider {
  LOCAL = 'local',
  S3 = 's3',
}

enum KnowledgeProvider {
  CUSTOM = 'custom',
  BEDROCK_KB = 'bedrock-kb',
}

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  APP_PORT: number = 3001;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRY: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRY: string = '7d';

  @IsEnum(AIProvider)
  @IsOptional()
  AI_PROVIDER: AIProvider = AIProvider.GEMINI;

  @IsEnum(EmbeddingProvider)
  @IsOptional()
  EMBEDDING_PROVIDER: EmbeddingProvider = EmbeddingProvider.GEMINI;

  @IsEnum(StorageProvider)
  @IsOptional()
  STORAGE_PROVIDER: StorageProvider = StorageProvider.LOCAL;

  @IsEnum(KnowledgeProvider)
  @IsOptional()
  KNOWLEDGE_PROVIDER: KnowledgeProvider = KnowledgeProvider.CUSTOM;

  @IsString()
  @IsOptional()
  GEMINI_API_KEY?: string;

  @IsString()
  @IsOptional()
  GEMINI_MODEL?: string = 'gemini-flash-latest';

  @IsString()
  @IsOptional()
  GEMINI_EMBEDDING_MODEL?: string = 'gemini-embedding-001';

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string = 'http://localhost:3000';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .join('\n')}`,
    );
  }

  return validatedConfig;
}
