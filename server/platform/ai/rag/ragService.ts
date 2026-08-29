import { db } from '../../db.ts';
import type { AIDocumentChunk, User, OrganizationMembership, AIUsageRecord } from '../../types.ts';
import { providerRegistry } from '../gateway/registry.ts';
import { RAGAuthZ } from './ragAuthZ.ts';
import { getVectorStore, VectorStoreSearchParams, VectorSearchResult } from './vectorStore.ts';
import { CurriculumResolver } from '../../curriculumResolver.ts';

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface SearchResult {
  chunk: AIDocumentChunk;
  score: number;
}

export interface SearchParams {
  query: string;
  topK?: number;
  documentId?: string;
  minScore?: number;
  courseIds?: string[]; // Course/Context isolation
}

export class RAGService {
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

  public static async indexDocument(params: {
    organizationId: string;
    documentId: string;
    sourceId?: string;
    sourceType?: string;
    sourceVisibility?: string;
    courseIds?: string[];
    userId?: string;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<AIDocumentChunk[]> {
    const { organizationId, documentId, sourceId, sourceType, sourceVisibility, courseIds, userId, title, content, metadata } = params;
    
    if (sourceType === 'AI_CONVERSATION' && !userId) {
      throw new Error('AI conversation indexing requires a mandatory userId for privacy and access control.');
    }

    const textChunks = this.chunkText(content);
    const provider = providerRegistry.getProvider('gemini');
    const createdChunks: AIDocumentChunk[] = [];
    const store = getVectorStore();

    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i];
      let embedding: number[] | undefined;
      
      if (provider.embedText) {
        embedding = await provider.embedText(chunkText);
      }

      const chunkRecord: AIDocumentChunk = {
        id: `chk_${documentId}_${i}_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        organizationId,
        documentId,
        sourceId,
        sourceType,
        sourceVisibility,
        courseIds,
        userId,
        title,
        content: chunkText,
        chunkIndex: i,
        embeddingModel: provider.name,
        embedding,
        metadata: {
          ...metadata,
          indexedAt: new Date().toISOString(),
          embeddingModel: provider.name,
        },
        createdAt: new Date().toISOString(),
      };
      
      await store.indexChunk(chunkRecord);
      createdChunks.push(chunkRecord);
    }
    return createdChunks;
  }

  public static async deleteBySource(organizationId: string, sourceId: string): Promise<void> {
      await getVectorStore().deleteBySource(organizationId, sourceId);
  }

  public static async secureSearch(
    activeUser: User,
    activeMembership: OrganizationMembership,
    params: SearchParams
  ): Promise<SearchResult[]> {
    const startTime = Date.now();
    const { query, topK = 3, documentId, minScore = 0.35, courseIds } = params;
    
    const orgId = activeMembership.organizationId;
    const provider = providerRegistry.getProvider('gemini');
    
    

    // Record AI Usage
    let inputTokens = query.length / 4;
    let outputTokens = 0;
    let embeddingStart = Date.now();
    
    const queryEmbedding = provider.embedText ? await provider.embedText(query) : [];
    
    const latencyMs = Date.now() - embeddingStart;
    db.recordAIUsage({
      id: `ai_use_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
      createdAt: new Date().toISOString(),
      organizationId: orgId,
      userId: activeUser.id,
      membershipId: activeMembership.id,
      provider: 'gemini',
      model: 'embedding',
      featureName: 'RAG_SEARCH' as any,
      inputTokens: Math.ceil(inputTokens),
      outputTokens,
      estimatedCost: 0,
      latencyMs,
      status: 'SUCCESS'
    });

    // 2. Query VectorStore
    const searchParams: VectorStoreSearchParams = {
        queryEmbedding,
        queryText: query,
        topK: topK * 3, // Fetch extra for post-filtering
        filter: {
            organizationIds: [orgId, 'platform'],
            courseIds,
            
            userId: activeUser.id,
            embeddingModel: provider.name
        }
    };
    
    const store = getVectorStore();
    const candidates = await store.search(searchParams);

    // 3. Post-Filtering / AuthZ Mirroring (Strictly preserving original authorization boundary)
    const scored: SearchResult[] = [];
    for (const res of candidates) {
      if (!RAGAuthZ.canAccessChunk(activeUser, activeMembership, res.chunk)) {
        continue;
      }
      
      if (res.score >= minScore) {
        scored.push({ chunk: res.chunk, score: res.score });
      }
    }
    
    return scored.slice(0, topK);
  }
}
