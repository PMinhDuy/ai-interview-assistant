import { ConfigService } from '@nestjs/config';
import { GeminiLLMProvider } from './gemini-llm.provider';
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
          if (val) process.env[key.trim()] = val;
        }
      }
    });
  }
}

loadEnvFile(path.resolve(__dirname, '../../../../../../.env'));
loadEnvFile(path.resolve(__dirname, '../../../../../.env'));

async function testGeminiLLM() {
  const config = new ConfigService();
  const provider = new GeminiLLMProvider(config);

  console.log('🚀 Testing GeminiLLMProvider live Cloud text generation...');
  const key = process.env.GEMINI_API_KEY || '';
  console.log('   Using API Key:', key ? '******' + key.slice(-4) : 'MISSING');

  const res = await provider.complete({
    messages: [
      { role: 'system', content: 'You are an expert tech interviewer.' },
      { role: 'user', content: 'Generate 1 technical question about NestJS dependency injection.' },
    ],
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  });

  console.log('✅ LLM Text Generation SUCCESSFUL!');
  console.log('   Provider:', res.provider);
  console.log('   Model:', res.model);
  console.log('   Latency:', res.latencyMs + 'ms');
  console.log('   Tokens:', res.usage);
  console.log('\n--- Generated Output ---\n' + res.content + '\n-----------------------');
}

testGeminiLLM().catch((err) => {
  console.error('❌ Live Gemini LLM test failed:', (err as Error).message);
});
