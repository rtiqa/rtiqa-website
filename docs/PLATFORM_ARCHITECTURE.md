# Rtiqa Education Platform — Architecture Blueprint & System Design

**Document Version:** 1.0.0  
**Target Product:** Rtiqa Multi-Tenant Cloud Education Platform (SaaS)  
**Scope:** Core Platform, Security, Multi-Tenancy, Backend Strategy, and System Boundaries  

---

## 1. Executive Summary & Vision

Rtiqa is conceived as an **AI-First Operating System for Education (AI OS for Education)**. Rather than being a static Learning Management System (LMS) or a rigid legacy School Information System (SIS), Rtiqa decouples:
1. **Public Marketing & Institutional Presence** (`rtiqa.com`)
2. **Interactive Multi-Tenant Education Portal** (`app.rtiqa.com`)
3. **Core Academic & Administrative API Services** (`api.rtiqa.com`)
4. **Autonomous Educational Intelligence Engine** (`ai.rtiqa.com`)

```
                          ┌─────────────────────────────┐
                          │   Global Ingress / CDN      │
                          │   (Cloudflare / Fastly)     │
                          └──────────────┬──────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
│ Marketing Site  │             │ Platform Portal │             │ AI Engine / API │
│   (Static SPA)  │             │   (React / PWA) │             │ (FastAPI/Node)  │
│   rtiqa.com     │             │  app.rtiqa.com  │             │   ai.rtiqa.com  │
└─────────────────┘             └────────┬────────┘             └────────┬────────┘
                                         │                               │
                                         ▼                               ▼
                                ┌─────────────────────────────────────────────────┐
                                │            Core Platform Gateway                │
                                │                api.rtiqa.com                    │
                                └────────────────────────┬────────────────────────┘
                                                         │
                                    ┌────────────────────┴────────────────────┐
                                    ▼                                         ▼
                         ┌───────────────────────┐                 ┌───────────────────────┐
                         │ Primary Relational DB │                 │   Vector & Cache DB   │
                         │ (PostgreSQL + RLS)    │                 │  (Qdrant / Redis)     │
                         └───────────────────────┘                 └───────────────────────┘
```

---

## 2. Multi-Tenant Architecture & Domain Separation

### 2.1 Domain Separation Strategy
To maintain absolute separation between prospective clients visiting the company profile and active schools utilizing the platform:

| Domain | Application Role | Tech Stack Recommendation | Hosting / Delivery |
| :--- | :--- | :--- | :--- |
| `rtiqa.com` | **Marketing Website**: Public information, SEO, lead capture, case studies. | React 18 + Vite + Tailwind (Current) | Static CDN / Edge Containers |
| `app.rtiqa.com` | **Education Platform UI**: Portal for Admins, Teachers, Students, Parents. | React + TypeScript + Headless UI + PWA | CDN + Cloud Run (Frontend) |
| `api.rtiqa.com` | **Core Platform API**: Auth, SIS, LMS, Grading, Multi-tenancy, Billing. | Node.js (NestJS / Fastify) OR Python / Go | Scalable Container Cluster |
| `ai.rtiqa.com` | **Rtiqa AI Engine**: Socratic Tutor, Lesson Generator, RAG Gateway. | Python (FastAPI / LangGraph / LiteLLM) | GPU/vCPU Container Cluster |

### 2.2 Multi-Tenancy Strategy (SaaS)

```
[Tenant Ingress: school-a.rtiqa.com OR Header: X-Tenant-ID: org_abc123]
                            │
                            ▼
               ┌─────────────────────────┐
               │   Tenant Resolution     │
               │   Middleware / Context   │
               └────────────┬────────────┘
                            │
                            ▼
               ┌─────────────────────────┐
               │   PostgreSQL Connection │
               │   Pool with Tenant RLS  │
               │   (Row Level Security)  │
               └─────────────────────────┘
```

**Selected Model: Shared Database + Isolated Row-Level Security (RLS) with Tenant ID Partitioning.**

- **Why Row-Level Security (RLS) over Separate Databases per School?**
  - **Operational Cost & Velocity**: Managing 1,000 separate database schemas or instances for 1,000 schools adds immense maintenance overhead, slow migration rollouts, and excessive resource idling.
  - **Cross-Institution Analytics**: Aggregated benchmarking for ministry/authority dashboards requires unified query capability.
  - **Enterprise Tenant Isolation**: For sovereign clients (e.g., Ministries of Education or large university systems requiring physically isolated databases), the architecture allows provisioning a dedicated tenant connection pool without changing application code.

---

## 3. Core Platform Modules & Functional Hierarchy

```
                                  ┌────────────────────────┐
                                  │   Rtiqa Core Engine    │
                                  └───────────┬────────────┘
        ┌───────────────────┬─────────────────┼─────────────────┬───────────────────┐
        ▼                   ▼                 ▼                 ▼                   ▼
┌───────────────┐   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   ┌───────────────┐
│ Identity &    │   │ Academic &    │ │ LMS & Content │ │ Assessment &  │   │ Parent &      │
│ Access (IAM)  │   │ School Struct │ │ Delivery      │ │ Evaluation    │   │ Communication │
└───────────────┘   └───────────────┘ └───────────────┘ └───────────────┘   └───────────────┘
```

### Module 1: Identity & Access Management (IAM)
- **Multi-Factor Auth & Passkeys**: Secure passwordless and TOTP login.
- **Role-Based Access Control (RBAC)** + **Attribute-Based Access Control (ABAC)**.
- **Tenant Context**: Every authenticated user session carries `active_organization_id` and assigned roles within that institution.
- **SSO Integration**: Google Workspace for Education, Microsoft 365 Education, and SAML 2.0.

### Module 2: Organizations & Academic Hierarchy
- **Organization**: School, Campus, District, or Higher Ed Institution.
- **Academic Years & Terms**: Semesters, Trimesters, Quarters with custom grading periods.
- **Grade Levels & Stages**: K-12 (Primary, Middle, Secondary) and Higher Ed (Undergraduate, Postgraduate).
- **Departments & Classrooms**: Physical and virtual room allocation.

### Module 3: Users & Profiles
- **Super Admin**: Platform-wide configuration, subscription management, tenant onboarding.
- **School Admin / Principal**: School settings, staffing, student rosters, compliance, timetable.
- **Teachers / Instructors**: Course authoring, lesson planning, grading, attendance, AI assistant.
- **Students / Learners**: Personal learning dashboard, Socratic AI tutor, assignments, grades.
- **Parents / Guardians**: Child progress monitoring, attendance alerts, teacher communication.
- **Authority / Inspector (Future)**: Oversight, standardized curriculum audits, aggregated analytics.

### Module 4: Learning Management (LMS) & Curriculum
- **Courses & Subjects**: National curriculum standards mapping, custom taxonomies.
- **Curriculum Units & Lessons**: Modular sequence of topics.
- **Interactive Content Repository**: Text, Video, Interactive SCORM/H5P, PDF, Audio.
- **Student Progress Tracking**: Micro-milestone completion and mastery status.

### Module 5: Assessments, Quizzes & Examinations
- **Question Bank**: Categorized by Bloom's Taxonomy level, subject, difficulty, and learning objective.
- **Adaptive Testing**: AI-driven dynamic difficulty adjustment.
- **Assignments & Rubrics**: File submissions, text entry, audio responses, peer review workflows.
- **Automated & Assisted Grading**: Objective grading for quizzes + AI-assisted formative grading for essays.

### Module 6: Attendance & Behavioral Tracking
- **Session Attendance**: Real-time roll-call (Present, Absent, Late, Excused).
- **Behavioral & Merits Ledger**: Positive reinforcement points and behavioral intervention logging.

### Module 7: Parent Portal & Communication
- **Real-Time Push Notifications**: SMS, WhatsApp Gateway, In-App, Email.
- **Parent-Teacher Scheduling**: Virtual or in-person conference booking.
- **Progress Reports**: Automated PDF term reports with narrative qualitative feedback.

### Module 8: Analytics, Auditing & Compliance
- **Real-Time Event Stream**: Tracking student engagement, mastery gaps, and drop-off points.
- **Immutable Audit Logs**: Every grade modification, user permission change, and export action logged.

---

## 4. Mobile & PWA Strategy

```
[Phase 1: Zero-Install PWA (Responsive Web + Service Worker)]
                     │
                     ▼
[Phase 2: Capacitor / React Native Bridge (Native iOS & Android Stores)]
```

### Why Start with a Progressive Web App (PWA)?
1. **Zero-Friction Deployment**: Schools do not need MDM (Mobile Device Management) approval or App Store review cycles to update critical school features.
2. **Universal Compatibility**: Works seamlessly across Chromebooks, Windows laptops, iPads, Android tablets, and budget smartphones.
3. **Responsive Mobile-First UI**: 100% of student and teacher interactions are touch-optimized.
4. **Native Transition Path**: Utilizing standard tools (e.g., Capacitor) allows packaging the existing React codebase into native iOS/Android binaries in Phase 3 without code rewriting.

---

## 5. Offline-First Architecture Roadmap

While MVP Phase 1 operates online, the system design must accommodate low-bandwidth and offline environments (e.g., rural schools or intermittent classroom Wi-Fi):

```
┌────────────────────────────────────────────────────────┐
│                    Client Browser                      │
│   ┌────────────────────────────────────────────────┐   │
│   │ IndexedDB (Local RxDB / TanStack DB Cache)     │   │
│   └───────────────────────┬────────────────────────┘   │
└───────────────────────────┼────────────────────────────┘
                            │ (CRDT / Version Vector Sync)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Backend Sync Engine                  │
│       - Conflict Resolution (Last-Write-Wins / CRDT)   │
│       - Background Queue Worker                        │
└────────────────────────────────────────────────────────┘
```

- **Data to Cache Locally**: Daily timetable, downloaded reading materials, offline quiz attempts, teacher attendance sheets.
- **Sync Protocol**: Optimistic local writes queued with unique UUIDs and synced via Background Sync API once connection is re-established.
