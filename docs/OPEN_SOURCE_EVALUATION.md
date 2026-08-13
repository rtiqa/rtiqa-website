# Rtiqa Education Platform — Open Source Evaluation & Build vs. Adopt Strategy

**Document Version:** 1.0.0  
**Target:** Rigorous Engineering Comparison of Open Source Foundations  

---

## 1. Executive Evaluation Matrix

| Open Source Solution | Primary Domain | License | Strengths | Weaknesses | Integration Feasibility | Adopt Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Frappe Framework / ERPNext** | SIS / ERP / Back-office | GPL-3.0 | Mature DocType metadata engine, built-in RBAC, workflows, MariaDB support. | Monolithic structure, Python/Desk UI coupling, multi-tenancy requires separate MariaDB databases per site. | Medium (Headless REST/RPC) | **Evaluate for SIS Backoffice / Hybrid** |
| **Frappe LMS** | Course / Content LMS | AGPL-3.0 | Out-of-the-box courses, chapters, quizzes, progress tracking. | Rigid UI templates, limited AI-native hooks, AGPL copyleft considerations. | Medium | **Incorporate Data Models / Hybrid Reference** |
| **Canvas LMS (Instructure)** | Traditional LMS | AGPL-3.0 | Global enterprise LMS standard, LTI 1.3 compliance. | Massive Ruby/Rails legacy footprint, high hosting cost, complex to modify. | Difficult | **Do Not Adopt** (Too heavyweight) |
| **Moodle** | Traditional LMS | GPL-3.0 | Extensive plugin ecosystem, global adoption. | Legacy PHP codebase, slow modern API experience, difficult AI integration. | Poor | **Do Not Adopt** |
| **LiteLLM / Ollama / vLLM** | AI Gateway & Inference | MIT / Apache 2.0 | Standardized OpenAI-compatible proxy for 100+ LLM providers, load balancing, cost tracking. | Requires separate deployment container. | High | **Adopt for AI Engine** |
| **Qdrant / pgvector** | Vector Search / RAG | Apache 2.0 / PostgreSQL | Lightning fast vector indexing, metadata filtering by tenant_id, low memory footprint. | None for our scale. | High | **Adopt for AI RAG Engine** |
| **BullMQ + Redis** | Background Job Queues | MIT | Robust async background processing (reports, emails, AI embedding generation). | Requires Redis server. | High | **Adopt for Async Tasks** |
| **MinIO** | Object Storage | AGPL-3.0 | S3-compatible, on-premise sovereign cloud file storage. | Needs backup management. | High | **Adopt for Sovereign Storage** |

---

## 2. In-Depth Technical Assessment: Frappe Framework & ERPNext Education

### 2.1 The Case For Frappe
- **DocType Metaprogramming**: Frappe provides instant CRUD APIs, automatic database schema generation, automated audit trails, and role permissions simply by defining JSON schemas.
- **Built-in Education Module in ERPNext**: Includes entities such as `Student`, `Instructor`, `Program`, `Course`, `Student Attendance`, `Assessment Plan`, and `Fee Structure`.
- **Rapidity for Admin Features**: Implementing administrative settings, teacher hiring workflows, and fee invoicing takes minimal development time compared to writing boilerplate from scratch.

### 2.2 The Architectural Bottlenecks & Limitations
1. **Multi-Tenancy Model**: Frappe achieves multi-tenancy via a "multi-bench / multi-database" approach (each school gets a distinct MariaDB database). While this provides clean data isolation, running 500 small schools requires managing 500 database instances/schemas, significantly increasing DevOps complexity and RAM requirements.
2. **Modern UX & AI-First Experience**: Frappe's default frontend (Desk / Portal) is built for traditional enterprise forms. Rtiqa's vision is a fluid, modern, real-time Socratic AI tutor and interactive teacher workspace. The frontend must be an independent, custom React 18+ SPA/PWA.
3. **AGPL/GPL Licensing Restrictions**: When deploying SaaS solutions, proprietary AI models and custom customer integrations must be cleanly isolated to respect open-source licenses.

### 2.3 The Recommended Hybrid Architectural Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             app.rtiqa.com                                   │
│            (Modern Custom React / TypeScript / Tailwind Frontend)           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
      ┌───────────────────────────┐         ┌───────────────────────────┐
      │     api.rtiqa.com         │         │     ai.rtiqa.com          │
      │  Core Platform Engine     │         │  Rtiqa AI Gateway         │
      │  (Node.js / FastAPI)      │         │  (LiteLLM + LangGraph)    │
      └─────────────┬─────────────┘         └─────────────┬─────────────┘
                    │                                     │
                    ▼                                     ▼
      ┌───────────────────────────┐         ┌───────────────────────────┐
      │  PostgreSQL (RLS Tenant)  │         │  Qdrant / pgvector        │
      │  + BullMQ Redis Queues    │         │  Curriculum Embeddings    │
      └───────────────────────────┘         └───────────────────────────┘
```

**Verdict:**
1. **Core SaaS Application (`api.rtiqa.com` + `app.rtiqa.com`)**: Build the student/teacher/admin core using modern **Node.js (TypeScript) + PostgreSQL with Row-Level Security (RLS)**. This guarantees maximum API performance, low resource consumption, and rapid UI/UX customizability.
2. **Borrow Data Models & Workflows**: Leverage the battle-tested schema concepts from Frappe Education (e.g. Assessment Criteria, Attendance Statuses, Course Schedule structures) without adopting the heavy monolithic runtime.
3. **Open-Source AI Foundation**: Utilize **LiteLLM**, **Qdrant**, and **Docling** for the intelligence layer to avoid reinventing document parsing, vector indexing, or model provider adapters.

---

## 3. "Build vs. Adopt" Decision Matrix

| Layer / Feature | Build Custom | Adopt Existing Open Source | Justification |
| :--- | :---: | :---: | :--- |
| **Marketing Site (`rtiqa.com`)** | **YES** | — | Already completed, high-performance static React site. |
| **Platform Frontend (`app.rtiqa.com`)** | **YES** | — | Needs bespoke Socratic AI interactions, modern Arabic/English typography, and role-adaptive dashboards. |
| **AI Gateway & Routing** | — | **ADOPT (LiteLLM)** | Standardizes LLM APIs, provides token streaming, fallback routing, and cost tracking. |
| **Document Ingestion for RAG** | — | **ADOPT (Docling / Unstructured)** | Flawless PDF/DOCX textbook parsing with table and math preservation. |
| **Vector Search Engine** | — | **ADOPT (Qdrant / pgvector)** | High-performance, scalable vector indexing with tenant filtering. |
| **Relational Core & Multi-tenancy** | **BUILD** | **ADOPT (PostgreSQL RLS)** | Custom API tailored for school workflows with native DB security. |
| **Queue & Worker Engine** | — | **ADOPT (BullMQ + Redis)** | Industry standard for async report generation and background tasks. |
| **File Storage** | — | **ADOPT (MinIO / S3 API)** | Universal cloud-agnostic storage with presigned URLs. |
