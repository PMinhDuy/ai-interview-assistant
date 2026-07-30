import { ConfigService } from '@nestjs/config';
import { GeminiEmbeddingProvider } from './gemini-embedding.provider';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        if (key) {
          const val = vals.join('=').trim();
          if (val) {
            process.env[key.trim()] = val;
          }
        }
      }
    });
  }
}

// Check root workspace .env
loadEnvFile(path.resolve(__dirname, '../../../../../../.env'));
loadEnvFile(path.resolve(__dirname, '../../../../../.env'));
loadEnvFile(path.resolve(__dirname, '../../../../.env'));

async function testGemini() {
  const config = new ConfigService();
  const provider = new GeminiEmbeddingProvider(config);

  console.log('🚀 Testing GeminiEmbeddingProvider live Cloud connection...');
  const key = process.env.GEMINI_API_KEY || '';
  console.log('   Using API Key:', key ? '******' + key.slice(-4) : 'MISSING');

  const res = await provider.embed({ text: 'Explain microservices architecture' });

  console.log('✅ Embedding Generation SUCCESSFUL!');
  console.log('   Provider:', res.provider);
  console.log('   Model:', res.model);
  console.log('   Dimensions:', res.dimensions);
  console.log('   Vector Sample (first 5 elements):', res.embedding.slice(0, 5));
}

testGemini().catch((err) => {
  console.error('❌ Live Gemini test failed:', (err as Error).message);
});
