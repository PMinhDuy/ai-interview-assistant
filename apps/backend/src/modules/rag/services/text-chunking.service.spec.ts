import { TextChunkingService } from './text-chunking.service';

describe('TextChunkingService', () => {
  let service: TextChunkingService;

  beforeEach(() => {
    service = new TextChunkingService();
  });

  it('should return empty array for empty string or whitespace', () => {
    expect(service.splitText('', 'res_1', 'RESUME')).toEqual([]);
    expect(service.splitText('   ', 'res_1', 'RESUME')).toEqual([]);
  });

  it('should return a single chunk if text fits within chunkSize', () => {
    const text = 'Short text that fits in one chunk.';
    const result = service.splitText(text, 'res_123', 'RESUME', { chunkSize: 500 });

    expect(result).toHaveLength(1);
    const chunk = result[0]!;
    expect(chunk.content).toBe(text);
    expect(chunk.sourceId).toBe('res_123');
    expect(chunk.sourceType).toBe('RESUME');
    expect(chunk.chunkIndex).toBe(0);
  });

  it('should split long text into multiple chunks', () => {
    const paragraph1 = 'First paragraph with some text details that exceed chunk size limit. '.repeat(10);
    const paragraph2 = 'Second paragraph with additional engineering experience information. '.repeat(10);
    const fullText = `${paragraph1}\n\n${paragraph2}`;

    const result = service.splitText(fullText, 'jd_99', 'JOB_DESCRIPTION', {
      chunkSize: 200,
      chunkOverlap: 20,
    });

    expect(result.length).toBeGreaterThan(1);
    const chunk0 = result[0]!;
    const chunk1 = result[1]!;
    expect(chunk0.sourceId).toBe('jd_99');
    expect(chunk0.sourceType).toBe('JOB_DESCRIPTION');
    expect(chunk0.chunkIndex).toBe(0);
    expect(chunk1.chunkIndex).toBe(1);
  });
});
