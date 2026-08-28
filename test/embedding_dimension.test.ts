import test from 'node:test';
import assert from 'node:assert';
import { GeminiProvider } from '../server/platform/ai/gateway/geminiProvider.ts';
import { RAGService } from '../server/platform/ai/rag/ragService.ts';
import { db } from '../server/platform/db.ts';
import { providerRegistry } from '../server/platform/ai/gateway/registry.ts';

test('Embedding Dimension Contract Regression', async (t) => {
  const provider = new GeminiProvider();

  await t.test('1. Provider correctly validates EXPECTED_DIMENSION (PASS)', async () => {
    const embedding = await provider.embedText('test text');
    assert.strictEqual(embedding.length, 768, 'Embedding must match the exact 768 dimension contract');
  });

  await t.test('2. Provider rejects invalid vector dimensions (FAIL)', async () => {
    const tempProvider = new GeminiProvider();
    (tempProvider as any).aiClient = {
      models: {
        embedContent: async () => {
          return {
            embedding: { values: [0.1, 0.2, 0.3] } 
          };
        }
      }
    };
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development'; 

    try {
      await tempProvider.embedText('test text');
      assert.fail('Should have thrown dimension mismatch error');
    } catch (err: any) {
      assert.match(err.message, /Embedding dimension mismatch/);
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  await t.test('3. RAG indexing fails before storage if dimension is invalid', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const fakeProvider = new GeminiProvider();
    (fakeProvider as any).aiClient = {
      models: {
        embedContent: async () => {
          return {
            embedding: { values: new Array(100).fill(0.5) } 
          };
        }
      }
    };
    
    const originalGetProvider = providerRegistry.getProvider.bind(providerRegistry);
    providerRegistry.getProvider = () => fakeProvider;

    const orgId = 'test_org';
    const docId = 'test_doc_' + Date.now();
    let indexingFailed = false;

    try {
      await RAGService.indexDocument({
        organizationId: orgId,
        documentId: docId,
        title: 'Bad Vector Doc',
        content: 'This vector will fail dimension validation',
      });
    } catch (err: any) {
      indexingFailed = true;
      assert.match(err.message, /Embedding dimension mismatch: expected 768, but got 100/);
    } finally {
      process.env.NODE_ENV = origEnv;
      providerRegistry.getProvider = originalGetProvider as any;
    }

    assert.ok(indexingFailed, 'RAGService must bubble up dimension validation errors');

    const chunks = db.getAIDocumentChunks(orgId, docId);
    assert.strictEqual(chunks.length, 0, 'No chunks should be stored if embedding fails dimension validation');
  });
});
