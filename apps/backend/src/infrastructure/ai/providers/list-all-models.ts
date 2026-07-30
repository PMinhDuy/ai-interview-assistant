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

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  console.log('Fetching available models from Google AI Studio...');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = (await res.json()) as { models: Array<{ name: string; supportedGenerationMethods: string[] }> };
  
  const textModels = data.models?.filter((m) =>
    m.supportedGenerationMethods?.includes('generateContent'),
  );

  console.log('Text generation models found:');
  textModels?.forEach((m) => {
    console.log(' - Name:', m.name);
  });
}

listModels().catch(console.error);
