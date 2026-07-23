-- PostgreSQL initialization script
-- Runs once on first container startup

-- Enable pgvector extension
-- This adds vector type and similarity search operators (<->, <#>, <=>)
-- Equivalent to enabling pgvector on Aurora PostgreSQL in AWS
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for full-text search (used for resume/JD search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify extensions
DO $$
BEGIN
  RAISE NOTICE 'Extensions enabled: vector, uuid-ossp, pg_trgm';
END $$;
