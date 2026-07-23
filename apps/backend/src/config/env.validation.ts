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
}

enum EmbeddingProvider {
  LOCAL = 'local',
  TITAN = 'titan',
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
  AI_PROVIDER: AIProvider = AIProvider.LOCAL;

  @IsEnum(EmbeddingProvider)
  @IsOptional()
  EMBEDDING_PROVIDER: EmbeddingProvider = EmbeddingProvider.LOCAL;

  @IsEnum(StorageProvider)
  @IsOptional()
  STORAGE_PROVIDER: StorageProvider = StorageProvider.LOCAL;

  @IsEnum(KnowledgeProvider)
  @IsOptional()
  KNOWLEDGE_PROVIDER: KnowledgeProvider = KnowledgeProvider.CUSTOM;

  @IsString()
  @IsOptional()
  OLLAMA_BASE_URL: string = 'http://localhost:11434';

  @IsString()
  @IsOptional()
  OLLAMA_DEFAULT_MODEL: string = 'llama3';

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
