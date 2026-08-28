import { AIDocumentChunk } from '../../types.ts';
import { InMemoryVectorStore } from './inMemoryVectorStore.ts';
import { PgVectorStore } from './pgVectorStore.ts';

export interface VectorStoreSearchFilter {
  organizationIds: string[];
  courseIds?: string[];
    userId?: string;
  embeddingModel?: string;
}

export interface VectorStoreSearchParams {
  queryEmbedding: number[];
  queryText?: string;
  topK: number;
  filter: VectorStoreSearchFilter;
}

export interface VectorSearchResult {
  chunk: AIDocumentChunk;
  score: number;
}

export interface VectorStore {
  indexChunk(chunk: AIDocumentChunk): Promise<void>;
  deleteBySource(organizationId: string, sourceId: string): Promise<void>;
  search(params: VectorStoreSearchParams): Promise<VectorSearchResult[]>;
}

const USE_PG_VECTOR = process.env.ENABLE_PG_VECTOR === 'true';
let instance: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (!instance) {
    if (USE_PG_VECTOR) {
      instance = new PgVectorStore();
    } else {
      instance = new InMemoryVectorStore();
    }
  }
  return instance;
}
