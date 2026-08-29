import { VectorStore, VectorStoreSearchParams, VectorSearchResult } from './vectorStore.ts';
import { AIDocumentChunk } from '../../types.ts';
import { getPostgresPool } from '../../../../src/db/postgres.ts';

export class PgVectorStore implements VectorStore {
  async indexChunk(chunk: AIDocumentChunk): Promise<void> {
    if (chunk.sourceType === 'AI_CONVERSATION' && !chunk.userId) {
      throw new Error('AI conversation indexing requires a mandatory userId for privacy and access control.');
    }
    if (chunk.embedding && chunk.embedding.length !== 768) {
      throw new Error('Embedding dimension mismatch. Expected 768.');
    }

    const pool = getPostgresPool();
    if (!pool) {
      throw new Error('PostgreSQL pool not initialized.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL app.current_tenant_id = $1", [chunk.organizationId]);
      if (chunk.userId) {
         await client.query("SET LOCAL app.current_user_id = $1", [chunk.userId]);
      }
      
      const sql = `
        INSERT INTO ai_document_chunks 
          (id, organization_id, document_id, source_id, source_type, source_visibility, user_id, course_ids, embedding_model, title, content, chunk_index, embedding, metadata)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          chunk_index = EXCLUDED.chunk_index,
          embedding_model = EXCLUDED.embedding_model,
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata,
          source_visibility = EXCLUDED.source_visibility
      `;
      
      const params = [
        chunk.id,
        chunk.organizationId,
        chunk.documentId,
        chunk.sourceId || null,
        chunk.sourceType || null,
        chunk.sourceVisibility || null,
        chunk.userId || null,
        chunk.courseIds || null,
        chunk.embeddingModel,
        chunk.title,
        chunk.content,
        chunk.chunkIndex,
        chunk.embedding ? JSON.stringify(chunk.embedding) : null,
        chunk.metadata ? JSON.stringify(chunk.metadata) : null,
      ];

      await client.query(sql, params);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  
  async deleteBySource(organizationId: string, sourceId: string): Promise<void> {
    const pool = getPostgresPool();
    if (!pool) {
      throw new Error('PostgreSQL pool not initialized.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL app.current_tenant_id = $1", [organizationId]);
      
      await client.query(`
        DELETE FROM ai_document_chunks 
        WHERE source_id = $1 AND organization_id = $2
      `, [sourceId, organizationId]);
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async search(params: VectorStoreSearchParams): Promise<VectorSearchResult[]> {
    if (params.filter.organizationIds.length === 0) return [];
    
    if (params.queryEmbedding.length !== 768) {
      throw new Error('Embedding dimension mismatch. Expected 768.');
    }

    const pool = getPostgresPool();
    if (!pool) {
      throw new Error('PostgreSQL pool not initialized.');
    }

    const orgId = params.filter.organizationIds[0];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query("SET LOCAL app.current_tenant_id = $1", [orgId]);
      if (params.filter.userId) {
        await client.query("SET LOCAL app.current_user_id = $1", [params.filter.userId]);
      }
      
      let sql = `
        SELECT 
          id, 
          organization_id as "organizationId", 
          document_id as "documentId", 
          source_id as "sourceId",
          source_type as "sourceType",
          source_visibility as "sourceVisibility",
          user_id as "userId", 
          course_ids as "courseIds",
          embedding_model as "embeddingModel", 
          title, 
          content, 
          chunk_index as "chunkIndex",
          metadata,
          created_at as "createdAt",
          1 - (embedding <=> $1::vector) as similarity
        FROM ai_document_chunks
        WHERE 1=1
      `;
      
      const queryParams: any[] = [JSON.stringify(params.queryEmbedding)];
      let paramIdx = 2;

      if (params.filter.embeddingModel) {
        sql += ` AND embedding_model = $${paramIdx}`;
        queryParams.push(params.filter.embeddingModel);
        paramIdx++;
      }

      if (params.filter.courseIds && params.filter.courseIds.length > 0) {
        sql += ` AND course_ids && $${paramIdx}`;
        queryParams.push(params.filter.courseIds);
        paramIdx++;
      }
      
      sql += ` AND (source_type != 'AI_CONVERSATION' OR user_id = $${paramIdx})`;
      queryParams.push(params.filter.userId || null);
      paramIdx++;

      sql += `
        ORDER BY embedding <=> $1::vector ASC
        LIMIT $${paramIdx}
      `;
      queryParams.push(params.topK);

      const res = await client.query(sql, queryParams);
      await client.query('COMMIT');
      
      return res.rows.map(row => {
         const score = row.similarity;
         delete row.similarity;
         return {
           chunk: row as AIDocumentChunk,
           score
         };
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
