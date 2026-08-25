-- =====================================================================
-- Migration 002: Universal Identity, Contextual Memberships & Decoupled SIS
-- =====================================================================

-- 1. Ensure Organization Memberships schema supports contextual multi-role state
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_memberships' AND column_name='status') THEN
        ALTER TABLE organization_memberships ADD COLUMN status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_memberships' AND column_name='student_profile_id') THEN
        ALTER TABLE organization_memberships ADD COLUMN student_profile_id VARCHAR(64);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_memberships' AND column_name='classroom_id') THEN
        ALTER TABLE organization_memberships ADD COLUMN classroom_id VARCHAR(64);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_memberships' AND column_name='is_default') THEN
        ALTER TABLE organization_memberships ADD COLUMN is_default BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_memberships' AND column_name='metadata') THEN
        ALTER TABLE organization_memberships ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Create Student Profiles (Decoupled Institutional SIS Records)
CREATE TABLE IF NOT EXISTS student_profiles (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    student_id_number VARCHAR(64),
    date_of_birth DATE,
    gender VARCHAR(16) DEFAULT 'OTHER',
    grade_level_id VARCHAR(64) REFERENCES grade_levels(id) ON DELETE SET NULL,
    classroom_id VARCHAR(64) REFERENCES classrooms(id) ON DELETE SET NULL,
    admission_date DATE,
    status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
    claim_token_hash VARCHAR(128),
    claim_token_expires_at TIMESTAMPTZ,
    is_claimed BOOLEAN DEFAULT FALSE NOT NULL,
    claimed_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_org ON student_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_claimed_user ON student_profiles(claimed_by_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_profiles_claim_user ON student_profiles (organization_id, claimed_by_user_id) WHERE claimed_by_user_id IS NOT NULL;

-- 3. Create Parent Link Tokens (Temporary, Single-Use Secure Link Tokens)
CREATE TABLE IF NOT EXISTS parent_link_tokens (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_profile_id VARCHAR(64) NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL,
    relationship VARCHAR(32) DEFAULT 'GUARDIAN' NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    used_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parent_link_tokens_org ON parent_link_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_parent_link_tokens_hash ON parent_link_tokens(token_hash);

-- 4. Enable Row Level Security Policies
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_student_profiles ON student_profiles;
CREATE POLICY tenant_isolation_student_profiles ON student_profiles
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

ALTER TABLE parent_link_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_parent_link_tokens ON parent_link_tokens;
CREATE POLICY tenant_isolation_parent_link_tokens ON parent_link_tokens
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));
