# Rtiqa Education Platform — MVP Roadmap & Phased Execution

**Document Version:** 1.0.0  
**Target:** Lean, Production-Grade Educational Platform Delivery  

---

## 1. Product Roadmap Overview

To ensure rapid market entry, immediate feedback from real pilot schools, and architectural stability, development is structured into **4 focused phases**.

```
┌─────────────────────────┐
│ Phase 1: Core MVP       │  ──▶ Foundation: SIS + LMS + Grading + Essential Dashboards
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Phase 2: AI Engine      │  ──▶ Intelligence: Socratic AI Tutor + Teacher Assistant + RAG
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Phase 3: Parent & Comms │  ──▶ Engagement: Parent Portal + Realtime Alerts + Analytics
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Phase 4: SaaS & Scale   │  ──▶ Scale: Multi-School Billing + Ministry Hub + Native Apps
└─────────────────────────┘
```

---

## 2. Detailed Phase Breakdown

### Phase 1: Core Pilot MVP (The "Day-1 Usable School" Release)
**Objective:** Provide a school with everything necessary to operate daily classes, track academic progress, submit homework, and issue grades without needing any third-party LMS.

| Module | Features Included in Phase 1 | Out of Scope for Phase 1 |
| :--- | :--- | :--- |
| **Authentication & IAM** | Email/Password login, password reset, session management, Role-Based Access (Admin, Teacher, Student). | Social Login, SAML/Enterprise SSO, Passkeys. |
| **Institution Setup** | School Profile, Academic Year, Term/Semester setup, Grade Levels (e.g., Grade 1 to 12). | Multi-campus federation, district-level aggregation. |
| **Rosters & User Mgmt** | Student enrollment, Teacher assignment, Classroom/Section allocation, CSV bulk import. | Real-time biometric attendance hardware sync. |
| **Courses & Curriculum** | Subject creation, Course structuring, Units, Lessons (Rich text, uploaded PDF, embedded video). | Complex interactive SCORM packaging player. |
| **Assignments & Tasks** | Assignment creation, deadlines, file attachments, student submissions, teacher feedback text. | Plagiarism detection API integrations. |
| **Quizzes & Tests** | Multiple choice, True/False, Short answer, auto-grading for objective questions, manual score entry. | Dynamic AI-generated test variants. |
| **Grading & Gradebook** | Weighted grade calculations, student gradebook view, teacher grade matrix. | Complex national curriculum transcript builder. |
| **Attendance** | Teacher daily attendance roll (Present, Absent, Late, Excused) with simple monthly summary. | Automated SMS push to parents on absence. |
| **Dashboards** | School Admin overview, Teacher daily timetable/active courses, Student my-tasks & grades. | Predictive machine learning drop-out early warnings. |

---

### Phase 2: Rtiqa AI Engine Integration
**Objective:** Transform the standard LMS into an autonomous, intelligent educational companion for both learners and educators.

- **AI Socratic Tutor (`app.rtiqa.com/tutor`)**:
  - Chat interface that guides students step-by-step rather than outputting raw answers.
  - Contextually grounded in the active lesson's uploaded textbook/curriculum via RAG.
- **Teacher AI Assistant (`app.rtiqa.com/teacher/ai-tools`)**:
  - **Lesson Plan Generator**: Generates 45-minute lesson plans following Bloom's Taxonomy.
  - **Question Bank Generator**: Generates 10 differentiated quiz questions from teacher's lesson notes.
  - **Differentiated Learning Content**: Rewrites complex text for varying student reading levels.
  - **Formative Feedback Drafter**: Suggests constructive student feedback for teacher review.
- **AI Governance & Guardrails**:
  - Toxic language filter, academic integrity controls, prompt injection protection.
  - School Admin AI token consumption and audit ledger.

---

### Phase 3: Parent Portal, Communications & Deep Analytics
**Objective:** Connect the broader school ecosystem and enable data-driven institutional decisions.

- **Parent / Guardian Portal (`app.rtiqa.com/parent`)**:
  - Multi-child dashboard with unified overview of grades, attendance, and upcoming deadlines.
  - Direct secure messaging with subject teachers.
- **Notification Engine**:
  - In-app notification center + transactional email notifications + WhatsApp/SMS webhook connector.
- **Academic Performance Analytics**:
  - Class mastery distributions, at-risk student identification, subject performance trends over terms.
- **Activity & Audit Logging**:
  - Administrative security audit logs tracking every permission change and score modification.

---

### Phase 4: Enterprise SaaS, Billing & Nationwide Scale
**Objective:** Self-serve onboarding for global private schools and centralized oversight for Ministries of Education.

- **Subscription & Invoicing Engine**:
  - Per-student/per-seat tiered pricing, Stripe / local payment gateway integration.
- **Ministry / Network Authority Hub**:
  - Multi-school oversight dashboard comparing learning outcomes and curriculum coverage across regions.
- **Offline-First & Mobile Binaries**:
  - Capacitor iOS and Android store packages with IndexedDB local caching.
- **Third-Party Marketplace & API Webhooks**:
  - Open REST/GraphQL API for third-party educational app developers.

---

## 3. Success Metrics & Milestone Deliverables

```
┌───────────────────────────┬────────────────────────────────────────────────────────┐
│ Milestone                 │ Key Deliverable                                        │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ M1 (Week 1-3)             │ Data Models, PostgreSQL RLS Schema, Auth & Tenant API  │
│ M2 (Week 4-6)             │ School Admin Portal + CSV Roster Import + Classes      │
│ M3 (Week 7-9)             │ Course Builder, Lesson Content & Assignment Submissions│
│ M4 (Week 10-12)           │ Quiz Engine, Gradebook, Daily Attendance & Testing     │
│ Pilot Ready (Phase 1)     │ Full end-to-end trial with 1-2 real educational cohorts│
└───────────────────────────┴────────────────────────────────────────────────────────┘
```
