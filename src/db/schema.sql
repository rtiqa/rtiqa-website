-- =====================================================================
-- RTIQA Smart Education Platform - Production Database Schema (PostgreSQL)
-- Multi-Tenant Architecture with Row-Level Security (RLS) & Foreign Keys
-- =====================================================================

-- Enable UUID & Cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    country_code VARCHAR(8) DEFAULT 'SA' NOT NULL,
    timezone VARCHAR(64) DEFAULT 'Asia/Riyadh' NOT NULL,
    locale VARCHAR(8) DEFAULT 'ar' NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- 2. Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_academic_years_org ON academic_years(organization_id);

-- 3. Terms / Semesters
CREATE TABLE IF NOT EXISTS terms (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    academic_year_id VARCHAR(64) NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_terms_org_year ON terms(organization_id, academic_year_id);

-- 4. Grade Levels (Stages)
CREATE TABLE IF NOT EXISTS grade_levels (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    sequence_order INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grade_levels_org ON grade_levels(organization_id);

-- 5. Classrooms (Sections)
CREATE TABLE IF NOT EXISTS classrooms (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    grade_level_id VARCHAR(64) NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    capacity INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_classrooms_org_grade ON classrooms(organization_id, grade_level_id);

-- 6. Users (Admins, Teachers, Students, Parents)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT')),
    avatar_url TEXT,
    phone VARCHAR(64),
    student_id_number VARCHAR(64),
    teacher_specialization VARCHAR(128),
    classroom_id VARCHAR(64) REFERENCES classrooms(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_users_org_email UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_users_org_classroom ON users(organization_id, classroom_id);

-- 7. Subjects (Curriculum Master)
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) NOT NULL,
    color VARCHAR(32) DEFAULT '#10b981',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_subjects_org_code UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_subjects_org ON subjects(organization_id);

-- 8. Courses (Active Class Instances)
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subject_id VARCHAR(64) NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    term_id VARCHAR(64) NOT NULL REFERENCES terms(id) ON DELETE RESTRICT,
    teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_org ON courses(organization_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(organization_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_classroom ON courses(organization_id, classroom_id);

-- 9. Lessons (Course Units & Content)
CREATE TABLE IF NOT EXISTS lessons (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_html TEXT NOT NULL,
    media_url TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    order_index INT DEFAULT 1 NOT NULL,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(organization_id, course_id, order_index);

-- 10. Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    max_score NUMERIC(5,2) DEFAULT 100 NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(organization_id, course_id);

-- 11. Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assignment_id VARCHAR(64) NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_attachment_url TEXT,
    score NUMERIC(5,2),
    teacher_feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    graded_at TIMESTAMPTZ,
    CONSTRAINT uq_submissions_assignment_student UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(organization_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(organization_id, student_id);

-- 12. Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(128) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_id VARCHAR(64) REFERENCES courses(id) ON DELETE SET NULL,
    classroom_id VARCHAR(64) REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_lookup ON attendance_records(organization_id, classroom_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(organization_id, student_id, date);

-- 13. Audit Logs (Security & Compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64),
    user_email VARCHAR(255),
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(64),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON audit_logs(organization_id, timestamp DESC);

-- 14. Invitations (Secure User Onboarding & Invite Codes)
CREATE TABLE IF NOT EXISTS invitations (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT')),
    invite_code VARCHAR(64) UNIQUE NOT NULL,
    tokenHash VARCHAR(255),
    full_name VARCHAR(255),
    classroom_id VARCHAR(64) REFERENCES classrooms(id) ON DELETE SET NULL,
    teacher_specialization VARCHAR(128),
    student_id_number VARCHAR(64),
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(organization_id, email);

-- 15. AI Conversations (Rtiqa AI Engine)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    context_type VARCHAR(64) DEFAULT 'general' NOT NULL,
    context_id VARCHAR(64),
    system_prompt_type VARCHAR(64) DEFAULT 'general' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_org_user ON ai_conversations(organization_id, user_id, updated_at DESC);

-- 16. AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    input_tokens INT DEFAULT 0 NOT NULL,
    output_tokens INT DEFAULT 0 NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(organization_id, conversation_id, created_at ASC);

-- 17. AI Usage Records (Auditing, Limits & Quota Metering)
CREATE TABLE IF NOT EXISTS ai_usage (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL,
    model VARCHAR(64) NOT NULL,
    feature_name VARCHAR(64) NOT NULL,
    input_tokens INT DEFAULT 0 NOT NULL,
    output_tokens INT DEFAULT 0 NOT NULL,
    estimated_cost NUMERIC(10, 6) DEFAULT 0 NOT NULL,
    latency_ms INT DEFAULT 0 NOT NULL,
    status VARCHAR(16) DEFAULT 'SUCCESS' NOT NULL CHECK (status IN ('SUCCESS', 'ERROR', 'RATE_LIMITED', 'BLOCKED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_org_time ON ai_usage(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_user ON ai_usage(organization_id, user_id);

-- 18. AI Document Chunks (RAG Foundation)
CREATE TABLE IF NOT EXISTS ai_document_chunks (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    chunk_index INT DEFAULT 0 NOT NULL,
    embedding JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_chunks_org_doc ON ai_document_chunks(organization_id, document_id);

-- =====================================================================
-- Row-Level Security (RLS) Policies & Enforcement
-- Multi-tenant isolation at the PostgreSQL storage engine level
-- Tenant is identified by session variable `app.current_tenant_id`
-- =====================================================================

-- Enable & Force RLS on all tenant-bound tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_document_chunks ENABLE ROW LEVEL SECURITY;

-- 1. Organizations Policy: Accessible if matching session tenant or if in global/unbound resolution mode
DROP POLICY IF EXISTS tenant_isolation_org ON organizations;
CREATE POLICY tenant_isolation_org ON organizations
    USING (
        id = NULLIF(current_setting('app.current_tenant_id', true), '')
        OR NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL
    );

-- 2. Academic Years Policy
DROP POLICY IF EXISTS tenant_isolation_academic_years ON academic_years;
CREATE POLICY tenant_isolation_academic_years ON academic_years
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 3. Terms Policy
DROP POLICY IF EXISTS tenant_isolation_terms ON terms;
CREATE POLICY tenant_isolation_terms ON terms
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 4. Grade Levels Policy
DROP POLICY IF EXISTS tenant_isolation_grade_levels ON grade_levels;
CREATE POLICY tenant_isolation_grade_levels ON grade_levels
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 5. Classrooms Policy
DROP POLICY IF EXISTS tenant_isolation_classrooms ON classrooms;
CREATE POLICY tenant_isolation_classrooms ON classrooms
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 6. Users Policy
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 7. Subjects Policy
DROP POLICY IF EXISTS tenant_isolation_subjects ON subjects;
CREATE POLICY tenant_isolation_subjects ON subjects
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 8. Courses Policy
DROP POLICY IF EXISTS tenant_isolation_courses ON courses;
CREATE POLICY tenant_isolation_courses ON courses
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 9. Lessons Policy
DROP POLICY IF EXISTS tenant_isolation_lessons ON lessons;
CREATE POLICY tenant_isolation_lessons ON lessons
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 10. Assignments Policy
DROP POLICY IF EXISTS tenant_isolation_assignments ON assignments;
CREATE POLICY tenant_isolation_assignments ON assignments
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 11. Submissions Policy
DROP POLICY IF EXISTS tenant_isolation_submissions ON submissions;
CREATE POLICY tenant_isolation_submissions ON submissions
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 12. Attendance Records Policy
DROP POLICY IF EXISTS tenant_isolation_attendance ON attendance_records;
CREATE POLICY tenant_isolation_attendance ON attendance_records
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 13. Audit Logs Policy
DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 14. Invitations Policy
DROP POLICY IF EXISTS tenant_isolation_invitations ON invitations;
CREATE POLICY tenant_isolation_invitations ON invitations
    USING (
        organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')
        OR NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL
    )
    WITH CHECK (
        organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')
        OR NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL
    );

-- 15. AI Conversations Policy
DROP POLICY IF EXISTS tenant_isolation_ai_conversations ON ai_conversations;
CREATE POLICY tenant_isolation_ai_conversations ON ai_conversations
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 16. AI Messages Policy
DROP POLICY IF EXISTS tenant_isolation_ai_messages ON ai_messages;
CREATE POLICY tenant_isolation_ai_messages ON ai_messages
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 17. AI Usage Policy
DROP POLICY IF EXISTS tenant_isolation_ai_usage ON ai_usage;
CREATE POLICY tenant_isolation_ai_usage ON ai_usage
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 18. AI Document Chunks Policy
DROP POLICY IF EXISTS tenant_isolation_ai_document_chunks ON ai_document_chunks;
CREATE POLICY tenant_isolation_ai_document_chunks ON ai_document_chunks
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

