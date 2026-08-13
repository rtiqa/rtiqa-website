# Rtiqa Education Platform — Data Architecture & Entity Design

**Document Version:** 1.0.0  
**Target:** Relational Data Model, Multi-Tenant Security, and Vector Storage  

---

## 1. Database Selection & Strategy

### Primary Storage: PostgreSQL 16+
- **Why PostgreSQL?**
  1. **Native Multi-Tenancy (Row-Level Security / RLS)**: Guarantees strict data segregation at the database engine level.
  2. **JSONB Support**: Semi-structured storage for flexible quiz question formats and rubrics.
  3. **Extensibility**:
     - `pgcrypto` & `uuid-ossp`: Secure ID generation and cryptography.
     - `pg_trgm`: Fast fuzzy search across student names and lesson content.
     - `pgvector`: Co-located vector embeddings for low-complexity RAG deployments.
- **Cache & Ephemeral Store: Redis 7+**
  - Session tokens, rate limiting counters, live AI conversation buffers, background job queues (BullMQ).
- **Object Storage: S3-Compatible (MinIO / Google Cloud Storage / AWS S3)**
  - Student assignment submissions, teacher slides, audio recordings, school logos (accessed via short-lived Presigned URLs).

---

## 2. Entity Relationship Diagram (Conceptual ERD)

```
┌─────────────────────────────────┐
│          organizations          │ (Tenants: Schools / Districts)
└────────────────┬────────────────┘
                 │ 1:N
        ┌────────┴────────┬─────────────────────────┬────────────────────────┐
        ▼                 ▼                         ▼                        ▼
┌───────────────┐ ┌───────────────┐         ┌───────────────┐        ┌───────────────┐
│academic_years │ │  grade_levels │         │     users     │        │   subjects    │
└───────┬───────┘ └───────┬───────┘         └───────┬───────┘        └───────┬───────┘
        │ 1:N             │ 1:N                     │ 1:N                    │ 1:N
        ▼                 ▼                         ▼                        ▼
┌───────────────┐ ┌───────────────┐         ┌───────────────┐        ┌───────────────┐
│     terms     │ │  classrooms   │◀────────┤  enrollments  │        │    courses    │
└───────────────┘ └───────┬───────┘         └───────────────┘        └───────┬───────┘
                          │                                                  │ 1:N
                          └───────────────────────┬──────────────────────────┘
                                                  ▼
                                      ┌───────────────────────┐
                                      │   course_sections     │
                                      └───────────┬───────────┘
                                                  │ 1:N
        ┌─────────────────────────────────────────┼────────────────────────────────────────┐
        ▼                                         ▼                                        ▼
┌───────────────┐                         ┌───────────────┐                        ┌───────────────┐
│    lessons    │                         │  assignments  │                        │    quizzes    │
└───────┬───────┘                         └───────┬───────┘                        └───────┬───────┘
        │ 1:N                                     │ 1:N                                    │ 1:N
        ▼                                         ▼                                        ▼
┌───────────────┐                         ┌───────────────┐                        ┌───────────────┐
│lesson_progress│                         │  submissions  │                        │ quiz_attempts │
└───────────────┘                         └───────────────┘                        └───────────────┘
```

---

## 3. Core Database Entities

### 3.1 Organization & Identity (IAM)
```sql
-- 1. Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,       -- e.g. 'al-noor-academy'
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    country_code VARCHAR(2) DEFAULT 'SA',
    timezone VARCHAR(64) DEFAULT 'Asia/Riyadh',
    locale VARCHAR(8) DEFAULT 'ar',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (Global identity with tenant context)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,              -- 'SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_org_email UNIQUE(organization_id, email)
);

-- 3. Guardian-Student Link (For Parent Portal)
CREATE TABLE guardian_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(32) DEFAULT 'PARENT', -- 'FATHER', 'MOTHER', 'GUARDIAN'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_guardian_student UNIQUE(organization_id, guardian_id, student_id)
);
```

### 3.2 Academic Structure & Rostering
```sql
-- 4. Academic Years & Terms
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,              -- e.g. '2026-2027'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE
);

CREATE TABLE terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,              -- e.g. 'Fall Semester'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE
);

-- 5. Classrooms & Sections
CREATE TABLE grade_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,              -- e.g. 'Grade 10'
    sequence_order INT NOT NULL
);

CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL               -- e.g. 'Class 10-A'
);
```

### 3.3 LMS, Curriculum & Assessments
```sql
-- 6. Courses & Curriculum
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,             -- e.g. 'Mathematics'
    code VARCHAR(32) NOT NULL               -- e.g. 'MATH-10'
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT
);

-- 7. Lessons
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_html TEXT,
    media_url TEXT,
    order_index INT DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE
);

-- 8. Assignments & Submissions
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_attachment_url TEXT,
    score NUMERIC(5,2),
    teacher_feedback TEXT,
    ai_suggested_feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ
);
```

### 3.4 Attendance & Auditing
```sql
-- 9. Attendance
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    status VARCHAR(16) NOT NULL,            -- 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_daily_attendance UNIQUE(organization_id, course_id, student_id, date)
);

-- 10. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,            -- e.g. 'GRADE_MODIFIED', 'USER_PROMOTED'
    resource_type VARCHAR(64) NOT NULL,     -- e.g. 'submission'
    resource_id UUID NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Multi-Tenant Row-Level Security (RLS) Implementation

```sql
-- Enable RLS on all operational tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Dynamic Tenant Isolation Policy
CREATE POLICY tenant_isolation_policy ON courses
    USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::UUID);
```

**How It Works:**
Before any database query is executed, the backend API connection middleware runs:
`SET LOCAL app.current_organization_id = 'org_abc123';`
This guarantees that queries cannot access or leak records belonging to another school, even in the event of an application-layer bug.
