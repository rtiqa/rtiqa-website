import { AIDocumentChunk } from '../../types.ts';
import { VectorStore, VectorStoreSearchParams, VectorSearchResult } from './vectorStore.ts';

export class PgVectorStore implements VectorStore {
  async indexChunk(chunk: AIDocumentChunk): Promise<void> {
    if (chunk.sourceType === 'AI_CONVERSATION' && !chunk.userId) {
      throw new Error('AI conversation indexing requires a mandatory userId for privacy and access control.');
    }
    if (chunk.embedding && chunk.embedding.length !== 768) {
      throw new Error('Embedding dimension mismatch');
    }
    // Future implementation: INSERT INTO ai_document_chunks ...
  }

  async deleteBySource(organizationId: string, sourceId: string): Promise<void> {
    // Future implementation: DELETE FROM ai_document_chunks WHERE organization_id = $1 AND source_id = $2
  }

  async search(params: VectorStoreSearchParams): Promise<VectorSearchResult[]> {
    // Future implementation:
    // SELECT chunk, 1 - (embedding <=> $1) as score FROM ai_document_chunks
    // WHERE organization_id IN ($2) AND ...
    return [];
  }
}
