import test from 'node:test';
import assert from 'node:assert';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AIDocumentChunk } from '../server/platform/types.ts';

const TEST_DB_URL = process.env.TEST_DATABASE_URL;

if (TEST_DB_URL && (TEST_DB_URL.includes('production') || TEST_DB_URL.includes('prod-db'))) {
    console.error('CRITICAL: Refusing to run integration tests against a likely production database.');
    process.exit(1);
}

test('PostgreSQL Integration Test Harness', async (t) => {
    if (!TEST_DB_URL) {
        await t.test('NOT EXECUTED - TEST_DATABASE_URL is missing', () => {
            console.log('SKIPPED: Real PostgreSQL tests require TEST_DATABASE_URL.');
            assert.ok(true);
        });
        return;
    }

    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.ENABLE_PG_VECTOR = 'true';
    
    // We import dynamically to ensure env vars are set before modules initialize
    const { getPostgresPool } = await import('../src/db/postgres.ts');
    const { PgVectorStore } = await import('../server/platform/ai/rag/pgVectorStore.ts');
    
    const pool = new pg.Pool({ connectionString: TEST_DB_URL });
    const pgStore = new PgVectorStore();
    
    // Test Setup
    await t.test('Setup Test Database Schema', async () => {
        const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
        await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
        await pool.query(schema);
        
        // Seed users & orgs for RLS
        await pool.query("INSERT INTO organizations (id, name, slug) VALUES ('tenant-a', 'Tenant A', 'tenant-a'), ('tenant-b', 'Tenant B', 'tenant-b'), ('platform', 'Platform', 'platform')");
        await pool.query("INSERT INTO users (id, name, email) VALUES ('user-a', 'User A', 'a@a.com'), ('user-b', 'User B', 'b@b.com')");
    });

    await t.test('A. pgvector availability', async (t2) => {
        await t2.test('CREATE EXTENSION vector capability', async () => {
            const res = await pool.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
            assert.strictEqual(res.rows.length, 1);
        });
        await t2.test('vector(768) column compatibility', async () => {
            const res = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'ai_document_chunks' AND column_name = 'embedding'");
            assert.strictEqual(res.rows[0].data_type, 'USER-DEFINED');
        });
    });

    const createChunk = (id: string, orgId: string, overrides: Partial<AIDocumentChunk> = {}): AIDocumentChunk => ({
        id,
        organizationId: orgId,
        documentId: 'doc1',
        title: 'Title',
        content: 'Content',
        chunkIndex: 0,
        embeddingModel: 'test-model',
        embedding: new Array(768).fill(0.1),
        createdAt: new Date().toISOString(),
        ...overrides
    });

    await t.test('B. PgVectorStore SQL behavior', async (t2) => {
        await t2.test('dimension mismatch rejection', async () => {
            const invalidChunk = createChunk('inv1', 'tenant-a', { embedding: [0.1] });
            await assert.rejects(pgStore.indexChunk(invalidChunk), /dimension mismatch/i);
        });
        
        await t2.test('insert/index chunk & cosine similarity search', async () => {
            const chunk1 = createChunk('chunk1', 'tenant-a');
            await pgStore.indexChunk(chunk1);
            
            const results = await pgStore.search({
                queryEmbedding: new Array(768).fill(0.1),
                topK: 1,
                filter: { organizationIds: ['tenant-a'] }
            });
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].chunk.id, 'chunk1');
        });

        await t2.test('delete by source', async () => {
            const chunk2 = createChunk('chunk2', 'tenant-a', { sourceId: 'src1' });
            await pgStore.indexChunk(chunk2);
            await pgStore.deleteBySource('tenant-a', 'src1');
            
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-a'");
            const res = await client.query("SELECT id FROM ai_document_chunks WHERE id = 'chunk2'");
            client.release();
            
            assert.strictEqual(res.rows.length, 0);
        });
    });

    await t.test('C. HNSW', async (t2) => {
        await t2.test('verify the HNSW index can actually be created', async () => {
            // Check if index exists from schema.sql
            const res = await pool.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'ai_document_chunks' AND indexname = 'ai_document_chunks_embedding_idx'");
            assert.strictEqual(res.rows.length, 1);
            assert.ok(res.rows[0].indexdef.includes('hnsw'));
        });
    });

    await t.test('D. RLS cross-tenant isolation', async (t2) => {
        await pool.query("INSERT INTO ai_document_chunks (id, organization_id, document_id, title, content, embedding_model) VALUES ('rls1', 'tenant-a', 'd1', 't', 'c', 'm') ON CONFLICT DO NOTHING");
        
        await t2.test('TEST 01: Tenant A can read its own private content', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-a'");
            const res = await client.query("SELECT * FROM ai_document_chunks WHERE id = 'rls1'");
            client.release();
            assert.strictEqual(res.rows.length, 1);
        });
        
        await t2.test('TEST 02: Tenant B cannot read Tenant A private content', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-b'");
            const res = await client.query("SELECT * FROM ai_document_chunks WHERE id = 'rls1'");
            client.release();
            assert.strictEqual(res.rows.length, 0);
        });
        
        await t2.test('TEST 03: Tenant B cannot insert content claiming Tenant A organization', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-b'");
            await assert.rejects(
                client.query("INSERT INTO ai_document_chunks (id, organization_id, document_id, title, content, embedding_model) VALUES ('rls2', 'tenant-a', 'd1', 't', 'c', 'm')"),
                /new row violates row-level security policy/
            );
            client.release();
        });

        await t2.test('TEST 04: Tenant B cannot update Tenant A content', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-b'");
            const res = await client.query("UPDATE ai_document_chunks SET title = 'hacked' WHERE id = 'rls1' RETURNING id");
            client.release();
            assert.strictEqual(res.rows.length, 0); // No rows updated due to RLS filter
        });

        await t2.test('TEST 05: Tenant B cannot delete Tenant A content', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-b'");
            const res = await client.query("DELETE FROM ai_document_chunks WHERE id = 'rls1' RETURNING id");
            client.release();
            assert.strictEqual(res.rows.length, 0); // No rows deleted
        });
    });

    await t.test('E. Platform/global content', async (t2) => {
        await pool.query("INSERT INTO ai_document_chunks (id, organization_id, document_id, title, content, embedding_model) VALUES ('plat1', 'platform', 'd1', 't', 'c', 'm') ON CONFLICT DO NOTHING");
        
        await t2.test('TEST 06: Tenant A can access permitted platform/global content', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-a'");
            const res = await client.query("SELECT * FROM ai_document_chunks WHERE id = 'plat1'");
            client.release();
            assert.strictEqual(res.rows.length, 1);
        });

        await t2.test('TEST 07: Tenant B can access permitted platform/global content', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-b'");
            const res = await client.query("SELECT * FROM ai_document_chunks WHERE id = 'plat1'");
            client.release();
            assert.strictEqual(res.rows.length, 1);
        });

        await t2.test('TEST 08: Tenant A cannot modify protected platform-owned content', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-a'");
            const res = await client.query("UPDATE ai_document_chunks SET title = 'hacked' WHERE id = 'plat1' RETURNING id");
            client.release();
            assert.strictEqual(res.rows.length, 0);
        });

        await t2.test('TEST 09: Tenant B cannot modify protected platform-owned content', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-b'");
            const res = await client.query("UPDATE ai_document_chunks SET title = 'hacked' WHERE id = 'plat1' RETURNING id");
            client.release();
            assert.strictEqual(res.rows.length, 0);
        });
    });

    await t.test('F. AI conversation privacy', async (t2) => {
        // Use pool directly to bypass PgVectorStore abstraction for precise testing
        await pool.query("INSERT INTO ai_document_chunks (id, organization_id, document_id, source_type, user_id, title, content, embedding_model) VALUES ('conv1', 'tenant-a', 'd1', 'AI_CONVERSATION', 'user-a', 't', 'c', 'm') ON CONFLICT DO NOTHING");
        
        await t2.test('TEST 10: User A can retrieve their own AI conversation chunks', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-a'");
            await client.query("SET LOCAL app.current_user_id = 'user-a'");
            const res = await client.query("SELECT id FROM ai_document_chunks WHERE id = 'conv1'");
            client.release();
            assert.strictEqual(res.rows.length, 1);
        });

        await t2.test('TEST 11: User B in the same organization cannot retrieve User A conversation chunks', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-a'");
            await client.query("SET LOCAL app.current_user_id = 'user-b'");
            const res = await client.query("SELECT id FROM ai_document_chunks WHERE id = 'conv1'");
            client.release();
            assert.strictEqual(res.rows.length, 0);
        });

        await t2.test('TEST 12: Missing user_id for AI conversation content is rejected', async () => {
            const chunk = createChunk('conv2', 'tenant-a', { sourceType: 'AI_CONVERSATION', userId: undefined });
            await assert.rejects(pgStore.indexChunk(chunk), /mandatory userId/i);
            
            // Database-level check
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-a'");
            await client.query("SET LOCAL app.current_user_id = 'user-a'");
            await assert.rejects(
                client.query("INSERT INTO ai_document_chunks (id, organization_id, document_id, source_type, user_id, title, content, embedding_model) VALUES ('conv3', 'tenant-a', 'd1', 'AI_CONVERSATION', NULL, 't', 'c', 'm')"),
                /new row violates row-level security policy/
            );
            client.release();
        });

        await t2.test('TEST 13: Cross-organization AI conversation access is rejected', async () => {
            const client = await pool.connect();
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-b'");
            await client.query("SET LOCAL app.current_user_id = 'user-a'");
            const res = await client.query("SELECT id FROM ai_document_chunks WHERE id = 'conv1'");
            client.release();
            assert.strictEqual(res.rows.length, 0);
        });
    });

    await t.test('G. Session context isolation', async (t2) => {
        await t2.test('TEST 14: SET LOCAL tenant context does not leak after transaction completion', async () => {
            const client = await pool.connect();
            await client.query("BEGIN");
            await client.query("SET LOCAL app.current_tenant_id = 'tenant-a'");
            await client.query("COMMIT");
            
            // Ensure outside the transaction, the variable is empty/null
            const res = await client.query("SELECT current_setting('app.current_tenant_id', true) as t");
            client.release();
            assert.ok(!res.rows[0].t || res.rows[0].t === '');
        });

        await t2.test('TEST 15: sequential requests do not inherit another tenant context', async () => {
            const client1 = await pool.connect();
            await client1.query("BEGIN");
            await client1.query("SET LOCAL app.current_tenant_id = 'tenant-a'");
            
            const client2 = await pool.connect();
            await client2.query("BEGIN");
            const res2 = await client2.query("SELECT current_setting('app.current_tenant_id', true) as t");
            
            await client1.query("COMMIT");
            await client2.query("COMMIT");
            client1.release();
            client2.release();
            
            assert.ok(!res2.rows[0].t || res2.rows[0].t === '');
        });

        await t2.test('TEST 16: concurrent/separate client transaction contexts remain isolated', async () => {
            const client1 = await pool.connect();
            const client2 = await pool.connect();
            
            await client1.query("BEGIN");
            await client1.query("SET LOCAL app.current_tenant_id = 'tenant-a'");
            
            await client2.query("BEGIN");
            await client2.query("SET LOCAL app.current_tenant_id = 'tenant-b'");
            
            const res1 = await client1.query("SELECT current_setting('app.current_tenant_id', true) as t");
            const res2 = await client2.query("SELECT current_setting('app.current_tenant_id', true) as t");
            
            await client1.query("COMMIT");
            await client2.query("COMMIT");
            client1.release();
            client2.release();
            
            assert.strictEqual(res1.rows[0].t, 'tenant-a');
            assert.strictEqual(res2.rows[0].t, 'tenant-b');
        });
    });

    t.after(async () => {
        await pool.end();
        // Clear the env var so we don't mess up other tests
        delete process.env.DATABASE_URL;
        delete process.env.ENABLE_PG_VECTOR;
    });
});
