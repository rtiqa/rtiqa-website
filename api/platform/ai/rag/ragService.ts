import { db } from '../../db';
import { AIDocumentChunk } from '../../types';
import { providerRegistry } from '../gateway/registry';

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface SearchResult {
  chunk: AIDocumentChunk;
  score: number;
}

export interface SearchParams {
  organizationId: string;
  query: string;
  topK?: number;
  documentId?: string;
  minScore?: number;
}

export class RAGService {
  /**
   * Split document text into overlapping chunks
   */
  public static chunkText(text: string, options: ChunkingOptions = {}): string[] {
    const chunkSize = options.chunkSize || 500;
    const overlap = options.chunkOverlap || 50;

    if (!text || text.length <= chunkSize) {
      return [text.trim()];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;
      if (end < text.length) {
        // Try to break at paragraph, sentence, or word boundary
        const nextBreak = text.lastIndexOf('\n', end);
        if (nextBreak > start + overlap) {
          end = nextBreak;
        } else {
          const nextSpace = text.lastIndexOf(' ', end);
          if (nextSpace > start + overlap) {
            end = nextSpace;
          }
        }
      }

      const chunk = text.substring(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      start = end - overlap;
      if (start >= text.length - overlap) break;
    }

    return chunks;
  }

  /**
   * Index educational document for a specific tenant
   */
  public static async indexDocument(params: {
    organizationId: string;
    documentId: string;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<AIDocumentChunk[]> {
    const { organizationId, documentId, title, content, metadata } = params;
    const textChunks = this.chunkText(content);
    const provider = providerRegistry.getProvider('gemini');
    const createdChunks: AIDocumentChunk[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i];
      let embedding: number[] | undefined;
      if (provider.embedText) {
        try {
          embedding = await provider.embedText(chunkText);
        } catch {
          embedding = undefined;
        }
      }

      const chunkRecord: AIDocumentChunk = {
        id: `chk_${documentId}_${i}_${Date.now()}`,
        organizationId,
        documentId,
        title,
        content: chunkText,
        chunkIndex: i,
        embedding,
        metadata: {
          ...metadata,
          indexedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      };

      db.createAIDocumentChunk(chunkRecord);
      createdChunks.push(chunkRecord);
    }

    return createdChunks;
  }

  /**
   * Vector similarity search constrained strictly by tenant (organizationId)
   */
  public static async searchSimilarChunks(params: SearchParams): Promise<SearchResult[]> {
    const { organizationId, query, topK = 3, documentId, minScore = 0.35 } = params;
    const provider = providerRegistry.getProvider('gemini');
    const queryEmbedding = provider.embedText ? await provider.embedText(query) : [];

    // Query chunks strictly from the caller's organization
    const chunks = db.getAIDocumentChunks(organizationId, documentId);

    const scored: SearchResult[] = [];
    for (const chunk of chunks) {
      const keywordScore = this.keywordSimilarity(query, chunk.content);
      let score = 0;
      if (chunk.embedding && queryEmbedding.length === chunk.embedding.length && queryEmbedding.length > 0) {
        const cosine = this.cosineSimilarity(queryEmbedding, chunk.embedding);
        score = keywordScore > 0 ? (cosine * 0.4 + keywordScore * 0.6) : (cosine * 0.5);
      } else {
        score = keywordScore;
      }
      if (score >= minScore) {
        scored.push({ chunk, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private static keywordSimilarity(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (queryWords.length === 0) return 0;
    const textLower = text.toLowerCase();
    let matches = 0;
    for (const w of queryWords) {
      if (textLower.includes(w)) matches++;
    }
    return matches / queryWords.length;
  }
}
