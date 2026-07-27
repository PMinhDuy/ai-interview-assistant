import { LocalEmbeddingProvider } from './local-embedding.provider';
import { ConfigService } from '@nestjs/config';

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] ?? 0), 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
}

async function runLocalEmbeddingTest() {
  console.log('🚀 Starting Local Embedding Provider Test...\n');

  const config = new ConfigService({
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    OLLAMA_EMBEDDING_MODEL: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
    EMBEDDING_DIMENSIONS: 768,
  });

  const provider = new LocalEmbeddingProvider(config);

  console.log('1️⃣ Checking Ollama Service Availability...');
  const isAvailable = await provider.isAvailable();
  if (!isAvailable) {
    console.error('❌ Ollama service is NOT available at http://localhost:11434');
    console.error('   Please make sure Ollama is running (`docker compose up -d ollama` or local Ollama app).');
    process.exit(1);
  }
  console.log('✅ Ollama service is UP and running!\n');

  const sampleTexts = {
    doc1: 'Kỹ sư lập trình Backend với kinh nghiệm NestJS, Node.js, TypeScript và PostgreSQL.',
    doc2: 'Lập trình viên làm về phần mềm máy chủ, RESTful API và cơ sở dữ liệu quan hệ.',
    doc3: 'Hôm nay thời tiết Hà Nội trời quang mây tạnh, không khí trong lành.',
  };

  console.log('2️⃣ Generating vector embeddings for sample texts...');
  try {
    const res1 = await provider.embed({ text: sampleTexts.doc1 });
    const res2 = await provider.embed({ text: sampleTexts.doc2 });
    const res3 = await provider.embed({ text: sampleTexts.doc3 });

    console.log(`✅ Embedding 1 generated! Dimensions: ${res1.dimensions}, Model: ${res1.model}`);
    console.log(`✅ Embedding 2 generated! Dimensions: ${res2.dimensions}, Model: ${res2.model}`);
    console.log(`✅ Embedding 3 generated! Dimensions: ${res3.dimensions}, Model: ${res3.model}\n`);

    console.log('3️⃣ Calculating Cosine Similarity Matrix:');
    const sim1_2 = cosineSimilarity(res1.embedding, res2.embedding);
    const sim1_3 = cosineSimilarity(res1.embedding, res3.embedding);

    console.log(`   - Sim(Backend Dev, Node/API Dev) [Same IT Domain]: ${sim1_2.toFixed(4)}`);
    console.log(`   - Sim(Backend Dev, Weather Hanoi) [Different Domain]: ${sim1_3.toFixed(4)}\n`);

    if (sim1_2 > sim1_3) {
      console.log('🎉 TEST SUCCESS: Embedding model correctly identified high similarity for same domain topics!');
    } else {
      console.warn('⚠️ WARNING: Unexpected similarity scoring.');
    }
  } catch (error) {
    console.error('❌ Failed to generate embeddings:', (error as Error).message);
    console.error('   Tip: Ensure model is downloaded via `docker exec ai-interview-ollama ollama pull nomic-embed-text`');
  }
}

runLocalEmbeddingTest();
