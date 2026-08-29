import { db } from '../../db.ts';
import { AIDocumentChunk } from '../../types.ts';
import { VectorStore, VectorStoreSearchParams, VectorSearchResult } from './vectorStore.ts';

export class InMemoryVectorStore implements VectorStore {
  async indexChunk(chunk: AIDocumentChunk): Promise<void> {
    if (chunk.sourceType === 'AI_CONVERSATION' && !chunk.userId) {
      throw new Error('AI conversation indexing requires a mandatory userId for privacy and access control.');
    }
    if (chunk.embedding && chunk.embedding.length !== 768) {
      throw new Error('Embedding dimension mismatch');
    }
    db.createAIDocumentChunk(chunk);
  }

  async deleteBySource(organizationId: string, sourceId: string): Promise<void> {
    db.deleteAIDocumentChunksBySource(organizationId, sourceId);
  }

  async search(params: VectorStoreSearchParams): Promise<VectorSearchResult[]> {
    const { queryEmbedding, queryText = '', topK, filter } = params;
    
    let allCandidates: AIDocumentChunk[] = [];
    for (const orgId of filter.organizationIds) {
      const chunks = db.getAIDocumentChunks(orgId);
      allCandidates.push(...chunks);
    }

    const filtered = allCandidates.filter(chunk => {
      if (filter.courseIds && filter.courseIds.length > 0) {
        if (chunk.courseIds && chunk.courseIds.length > 0) {
          const intersects = chunk.courseIds.some(cid => filter.courseIds!.includes(cid));
          if (!intersects) return false;
        }
      }
      
      if (chunk.sourceType === 'AI_CONVERSATION') {
        if (!chunk.userId || chunk.userId !== filter.userId) {
          return false;
        }
      }
      if (filter.embeddingModel && chunk.embeddingModel) {
        if (chunk.embeddingModel !== filter.embeddingModel) {
          return false;
        }
      }
      return true;
    });

    const scored: VectorSearchResult[] = [];
    for (const chunk of filtered) {
      const keywordScore = this.keywordSimilarity(queryText, chunk.content);
      let score = 0;
      if (chunk.embedding && queryEmbedding.length === chunk.embedding.length && queryEmbedding.length > 0) {
        const cosine = this.cosineSimilarity(queryEmbedding, chunk.embedding);
        score = keywordScore > 0 ? (cosine * 0.4 + keywordScore * 0.6) : (cosine * 0.5);
      } else {
        score = keywordScore;
      }
      scored.push({ chunk, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
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

  private keywordSimilarity(query: string, text: string): number {
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
