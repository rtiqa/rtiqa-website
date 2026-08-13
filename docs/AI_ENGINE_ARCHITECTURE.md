# Rtiqa AI Engine — Autonomous Intelligence Layer Architecture

**Document Version:** 1.0.0  
**Target:** Multi-Model, Provider-Agnostic Educational Intelligence  
**Component Identifier:** `ai.rtiqa.com`  

---

## 1. Architectural Philosophy

The **Rtiqa AI Engine** is designed as an autonomous, sovereign educational intelligence layer, distinct from a generic chatbot. Its mission is to uphold pedagogical integrity, support teacher productivity, and provide safe, personalized tutoring.

```
                      ┌────────────────────────────────────────┐
                      │   Client Requests (Web / Mobile)       │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │            Rtiqa AI Gateway            │
                      │     (Rate Limiter, Auth, Guardrails)   │
                      └───────────────────┬────────────────────┘
                                          │
          ┌───────────────────────────────┼───────────────────────────────┐
          ▼                               ▼                               ▼
┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
│ Socratic Tutor    │           │ Teacher Assistant │           │ Curriculum RAG    │
│ Agent (Pedagogy)  │           │ Suite (Workflow)  │           │ Engine (Knowledge)│
└─────────┬─────────┘           └─────────┬─────────┘           └─────────┬─────────┘
          │                               │                               │
          └───────────────────────────────┼───────────────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │       Model Provider Abstraction       │
                      │  (Google Gemini, Anthropic, OpenAI,    │
                      │   DeepSeek, Self-Hosted vLLM/Ollama)   │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    Token Ledger & Safety Audit Log     │
                      └────────────────────────────────────────┘
```

---

## 2. Core Subsystems

### 2.1 AI Gateway & Model Provider Abstraction
To prevent lock-in to any single AI provider and optimize for cost, latency, and compliance:
- **Unified Interface**: `generateCompletion(request: AIRequest): Promise<AIResponse>`
- **Supported Adapters**:
  - `GoogleGenAIAdapter` (Gemini 2.5 Flash / Pro) — Primary for multilingual speed & long context.
  - `AnthropicAdapter` (Claude 3.5 Sonnet) — Secondary for advanced qualitative feedback and complex coding tasks.
  - `OpenAIAdapter` (GPT-4o / GPT-4o-mini) — Fallback.
  - `LocalOpenSourceAdapter` (vLLM / Ollama with Llama 3 / Qwen 2.5) — For sovereign on-premise national deployments.
- **Dynamic Fallback & Routing**: If Provider A encounters 429/500 errors, the gateway automatically routes requests to Provider B with zero downtime.

---

### 2.2 Pedagogical Guardrails & Safety Filter
Unlike open web chatbots, educational AI must never violate safety or do students' homework without effort.

```
[User Prompt] ──▶ [1. PII Redaction] ──▶ [2. Prompt Injection Check] ──▶ [3. Pedagogical Policy] ──▶ [LLM]
                                                                                                        │
[User Display] ◀── [6. Citation Verifier] ◀── [5. Toxicity / Safety Screen] ◀── [4. Output Format Validator] ◀──┘
```

1. **PII Anonymization**: Student names, emails, and school IDs are scrubbed before sending prompts to external LLM endpoints.
2. **Socratic Mode Enforcement**: System instructions mandate that the model **must not** provide direct solutions to math/science problems, but rather ask guiding Socratic questions.
3. **Age-Appropriate Language Modulation**: Adapts tone, vocabulary, and examples based on the student's grade level.
4. **Content Moderation**: Strict filters against hate speech, harassment, self-harm, and inappropriate topics.

---

### 2.3 Retrieval-Augmented Generation (RAG) Architecture

```
[Teacher Uploads: PDF Textbook / Curriculum Doc]
                   │
                   ▼
       ┌───────────────────────┐
       │   Docling / Unstructured │ (Text, Table & Formula Extraction)
       └───────────┬───────────┘
                   ▼
       ┌───────────────────────┐
       │ Semantic Chunking     │ (300-500 tokens with 50-token overlap)
       └───────────┬───────────┘
                   ▼
       ┌───────────────────────┐
       │ Text Embeddings Model │ (text-embedding-004 / multilingual-e5)
       └───────────┬───────────┘
                   ▼
       ┌───────────────────────┐
       │ Vector DB (Qdrant /   │
       │ PostgreSQL pgvector)  │ (Partitioned by tenant_id & subject_id)
       └───────────────────────┘
```

- **Query-Time Retrieval**:
  - Hybrid Search: Dense Vector Similarity (Cosine) + Sparse Keyword Search (BM25) for technical and mathematical terms.
  - Reciprocal Rank Fusion (RRF) to blend results.
  - Context Injection: Only top 3-5 most relevant curriculum passages are attached to the prompt.

---

### 2.4 Autonomous Feature Modules

#### A. Socratic AI Tutor
- Multi-turn conversation state kept in Redis session store.
- Keeps track of:
  - Current concept student is struggling with.
  - Hints already provided (Level 1: Concept reminder, Level 2: Leading question, Level 3: Worked example with different numbers).
  - Confidence score of student mastery.

#### B. Teacher AI Copilot
1. **Curriculum-Aligned Lesson Generator**:
   - Inputs: Subject, Grade Level, Learning Objective, Duration (e.g., 45 mins).
   - Outputs: Lesson outline, introductory hook, guided practice, formative check, and exit ticket questions.
2. **Differentiated Question Bank Creator**:
   - Generates questions calibrated by Bloom's Taxonomy (Remember, Understand, Apply, Analyze, Evaluate, Create).
3. **Formative Feedback Drafter**:
   - Evaluates open-ended student submissions against the teacher's rubric and drafts actionable, encouraging feedback for teacher review and approval.

---

### 2.5 Token Tracking & Cost Control
- Every tenant (school) has an allocated monthly AI token quota.
- Sub-quotas can be configured per role (e.g., Teachers: 500k tokens/mo, Students: 50k tokens/mo).
- Real-time Redis counter blocks runaway requests and warns school administrators when approaching 80% usage.
