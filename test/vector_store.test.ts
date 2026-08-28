import test from 'node:test';
import assert from 'node:assert';
import { getVectorStore, VectorStoreSearchParams } from '../server/platform/ai/rag/vectorStore.ts';
import { InMemoryVectorStore } from '../server/platform/ai/rag/inMemoryVectorStore.ts';
import { PgVectorStore } from '../server/platform/ai/rag/pgVectorStore.ts';
import type { AIDocumentChunk } from '../server/platform/types.ts';
import { db } from '../server/platform/db.ts';

test('VectorStore Abstraction Contract Test Suite', async (t) => {
    
    // Setup generic mock chunks
    const createValidChunk = (id: string, orgId: string, userId?: string, isConv = false, content = 'Test'): AIDocumentChunk => ({
        id,
        organizationId: orgId,
        documentId: 'doc1',
        title: 'Title',
        content,
        chunkIndex: 0,
        sourceType: isConv ? 'AI_CONVERSATION' : 'DOCUMENT',
        userId,
        embedding: new Array(768).fill(0.1), // Valid dimension
        createdAt: new Date().toISOString()
    });

    await t.test('TEST 10 & 11: InMemoryVectorStore is used by default and PgVector is not activated automatically', () => {
        const store = getVectorStore();
        assert.ok(store instanceof InMemoryVectorStore, 'Default store should be InMemoryVectorStore');
        assert.ok(!(store instanceof PgVectorStore), 'PgVectorStore should not be active by default');
    });

    await t.test('TEST 01: indexChunk accepts a valid chunk', async () => {
        const store = new InMemoryVectorStore();
        const chunk = createValidChunk('chk_valid_1', 'org1');
        await assert.doesNotReject(store.indexChunk(chunk), 'Should accept valid chunk');
    });

    await t.test('TEST 02 & 03: indexChunk rejects wrong embedding dimensions', async () => {
        const store = new InMemoryVectorStore();
        const invalidChunk: AIDocumentChunk = {
            ...createValidChunk('chk_invalid_dim', 'org1'),
            embedding: [0.1, 0.2], // dimension is 2 instead of 768
        };
        await assert.rejects(store.indexChunk(invalidChunk), /dimension mismatch/);
        
        const pgStore = new PgVectorStore();
        await assert.rejects(pgStore.indexChunk(invalidChunk), /dimension mismatch/, 'PgVectorStore should also validate dimension');
    });

    await t.test('TEST 04: AI_CONVERSATION without userId rejects on index', async () => {
        const store = new InMemoryVectorStore();
        const invalidChunk: AIDocumentChunk = {
            ...createValidChunk('chk_invalid_conv', 'org1', undefined, true) // No userId
        };
        await assert.rejects(store.indexChunk(invalidChunk), /mandatory userId/);

        const pgStore = new PgVectorStore();
        await assert.rejects(pgStore.indexChunk(invalidChunk), /mandatory userId/, 'PgVectorStore should also validate userId for conversations');
    });

    await t.test('TEST 05: deleteBySource deletes the correct source only', async () => {
        const store = new InMemoryVectorStore();
        const chunk1 = { ...createValidChunk('chk_del_1', 'org1'), sourceId: 'src1' };
        const chunk2 = { ...createValidChunk('chk_del_2', 'org1'), sourceId: 'src2' };
        
        await store.indexChunk(chunk1);
        await store.indexChunk(chunk2);

        await store.deleteBySource('org1', 'src1');
        
        const results = await store.search({
            queryEmbedding: new Array(768).fill(0.1),
            topK: 10,
            filter: { organizationIds: ['org1'] }
        });

        const foundChunk1 = results.find(r => r.chunk.id === 'chk_del_1');
        const foundChunk2 = results.find(r => r.chunk.id === 'chk_del_2');

        assert.ok(!foundChunk1, 'Chunk 1 should be deleted');
        assert.ok(foundChunk2, 'Chunk 2 should remain intact');
    });

    await t.test('TEST 06: search returns results based on similarity (InMemory)', async () => {
        const store = new InMemoryVectorStore();
        // Keyword similarity test for in-memory
        const chunk1 = { ...createValidChunk('chk_sim_1', 'org_sim'), content: 'apple banana orange' };
        const chunk2 = { ...createValidChunk('chk_sim_2', 'org_sim'), content: 'car truck bus' };
        
        await store.indexChunk(chunk1);
        await store.indexChunk(chunk2);

        const results = await store.search({
            queryEmbedding: new Array(768).fill(0.1),
            queryText: 'banana',
            topK: 10,
            filter: { organizationIds: ['org_sim'] }
        });

        assert.ok(results.length > 0);
        assert.strictEqual(results[0].chunk.id, 'chk_sim_1', 'Should prioritize keyword match in fallback');
    });

    await t.test('TEST 07: Organization A does not see data from Organization B', async () => {
        const store = new InMemoryVectorStore();
        const chunkA = createValidChunk('chk_orgA_1', 'orgA');
        const chunkB = createValidChunk('chk_orgB_1', 'orgB');
        
        await store.indexChunk(chunkA);
        await store.indexChunk(chunkB);

        const resultsForA = await store.search({
            queryEmbedding: new Array(768).fill(0.1),
            topK: 10,
            filter: { organizationIds: ['orgA'] }
        });

        assert.ok(resultsForA.some(r => r.chunk.id === 'chk_orgA_1'), 'Should see Org A chunk');
        assert.ok(!resultsForA.some(r => r.chunk.id === 'chk_orgB_1'), 'Should NOT see Org B chunk');
    });

    await t.test('TEST 08: AI User A does not see Conversation of User B', async () => {
        const store = new InMemoryVectorStore();
        const chunkUserA = createValidChunk('chk_userA_1', 'org1', 'userA', true);
        const chunkUserB = createValidChunk('chk_userB_1', 'org1', 'userB', true);
        
        await store.indexChunk(chunkUserA);
        await store.indexChunk(chunkUserB);

        const resultsForA = await store.search({
            queryEmbedding: new Array(768).fill(0.1),
            topK: 10,
            filter: { organizationIds: ['org1'], userId: 'userA' }
        });

        assert.ok(resultsForA.some(r => r.chunk.id === 'chk_userA_1'), 'User A sees their conversation');
        assert.ok(!resultsForA.some(r => r.chunk.id === 'chk_userB_1'), 'User A does NOT see User B conversation');
    });

    await t.test('TEST 09: VectorStore does not manage Local Override directly', async () => {
        // VectorStore accepts all orgs passed to it, filtering is done post-search by RAGAuthZ
        // We just prove VectorStore returns chunks from 'platform' if requested.
        const store = new InMemoryVectorStore();
        const chunkPlatform = createValidChunk('chk_plat_1', 'platform');
        await store.indexChunk(chunkPlatform);

        const results = await store.search({
            queryEmbedding: new Array(768).fill(0.1),
            topK: 10,
            filter: { organizationIds: ['orgX', 'platform'] }
        });
        
        assert.ok(results.some(r => r.chunk.organizationId === 'platform'), 'VectorStore returns platform chunks, RAGAuthZ handles overrides');
    });

    await t.test('TEST 12: PgVectorStore returns empty search as Dormant Adapter', async () => {
        const pgStore = new PgVectorStore();
        const result = await pgStore.search({ queryEmbedding: [], topK: 3, filter: { organizationIds: ['org1'] } });
        assert.deepStrictEqual(result, [], 'PgVectorStore should return empty array in dormant mode');
    });

});
