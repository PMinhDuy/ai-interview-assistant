import { Injectable, Logger } from '@nestjs/common';
import type { DocumentChunk } from '@repo/types';

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

@Injectable()
export class TextChunkingService {
  private readonly logger = new Logger(TextChunkingService.name);

  private readonly defaultSeparators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ' ', ''];
  private readonly defaultChunkSize = 512;
  private readonly defaultChunkOverlap = 64;

  /**
   * Recursively split text into manageable chunks with overlap
   */
  splitText(
    text: string,
    sourceId: string,
    sourceType: DocumentChunk['sourceType'],
    options: ChunkingOptions = {},
    metadata: Record<string, unknown> = {},
  ): DocumentChunk[] {
    const chunkSize = options.chunkSize ?? this.defaultChunkSize;
    const chunkOverlap = options.chunkOverlap ?? this.defaultChunkOverlap;
    const separators = options.separators ?? this.defaultSeparators;

    if (!text || text.trim().length === 0) {
      return [];
    }

    const rawChunks = this.recursiveSplit(text.trim(), chunkSize, chunkOverlap, separators);

    return rawChunks.map((content, index) => ({
      id: `${sourceType.toLowerCase()}_${sourceId}_chunk_${index}`,
      sourceId,
      sourceType,
      content,
      chunkIndex: index,
      metadata: {
        ...metadata,
        characterLength: content.length,
        estimatedTokens: Math.ceil(content.length / 4),
      },
    }));
  }

  private recursiveSplit(
    text: string,
    chunkSize: number,
    chunkOverlap: number,
    separators: string[],
  ): string[] {
    if (text.length <= chunkSize) {
      return [text];
    }

    let separator: string = separators[separators.length - 1] ?? '';
    let newSeparators: string[] = [];

    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s !== undefined && (s === '' || text.includes(s))) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }

    const splits = separator !== '' ? text.split(separator) : text.split('');
    const finalChunks: string[] = [];
    const currentChunk: string[] = [];
    let currentLength = 0;

    for (const split of splits) {
      const splitLength = split.length + (separator !== '' ? separator.length : 0);

      if (currentLength + splitLength > chunkSize && currentChunk.length > 0) {
        const chunkText = currentChunk.join(separator).trim();
        if (chunkText) {
          finalChunks.push(chunkText);
        }

        while (
          currentChunk.length > 0 &&
          currentChunk.join(separator).length > chunkOverlap
        ) {
          currentChunk.shift();
        }

        currentLength = currentChunk.join(separator).length;
      }

      currentChunk.push(split);
      currentLength += splitLength;
    }

    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(separator).trim();
      if (chunkText) {
        finalChunks.push(chunkText);
      }
    }

    const result: string[] = [];
    for (const chunk of finalChunks) {
      if (chunk.length > chunkSize && newSeparators.length > 0) {
        result.push(...this.recursiveSplit(chunk, chunkSize, chunkOverlap, newSeparators));
      } else {
        result.push(chunk);
      }
    }

    return result;
  }
}
