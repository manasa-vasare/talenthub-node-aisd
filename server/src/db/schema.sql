-- ============================================================================
-- TALENT HUB - RELATIONAL DATABASE SCHEMA (PostgreSQL 3NF / BCNF)
-- Detailed Design from Lab 4: Data Design • Algorithm Design • Security Design
-- ============================================================================

-- Clean up if needed (for fresh setup)
-- Note: Foreign keys use ON DELETE RESTRICT per Lab 4 specification.
DROP TABLE IF EXISTS eligibility_decisions CASCADE;
DROP TABLE IF EXISTS application_status_log CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS interview_slots CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS job_allowed_branches CASCADE;
DROP TABLE IF EXISTS job_listings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- ----------------------------------------------------------------------------
-- 1. STUDENTS
-- Stores candidates and academic data used for eligibility checking & consent.
-- Privacy: Erasure on request anonymises the row in place so FKs stay valid.
-- ----------------------------------------------------------------------------
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    usn VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    branch VARCHAR(20) NOT NULL CHECK (branch IN ('CSE', 'ECE', 'ISE', 'MECH', 'CIVIL')),
    cgpa NUMERIC(4, 2) NOT NULL CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    active_backlogs INT NOT NULL DEFAULT 0 CHECK (active_backlogs >= 0),
    cleared_backlogs INT NOT NULL DEFAULT 0 CHECK (cleared_backlogs >= 0),
    has_accepted_offer BOOLEAN NOT NULL DEFAULT FALSE,
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    consent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. COMPANIES
-- Stores recruiting organisations.
-- ----------------------------------------------------------------------------
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    website VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. USERS
-- Supports JWT authentication and server-side role-based access control.
-- Passwords stored only as salted hashes.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'company', 'coordinator')),
    student_id INT UNIQUE REFERENCES students(id) ON DELETE RESTRICT,
    company_id INT REFERENCES companies(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. JOB_LISTINGS
-- Stores roles posted by companies with eligibility criteria and drive dates.
-- ----------------------------------------------------------------------------
CREATE TABLE job_listings (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    role VARCHAR(100) NOT NULL,
    season VARCHAR(20) NOT NULL,
    min_cgpa NUMERIC(4, 2) NOT NULL CHECK (min_cgpa >= 0.00 AND min_cgpa <= 10.00),
    max_backlogs INT NOT NULL DEFAULT 0 CHECK (max_backlogs >= 0),
    drive_date DATE NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    package_lpa NUMERIC(6, 2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. JOB_ALLOWED_BRANCHES
-- Created during 1NF decomposition to eliminate multi-valued branch column.
-- RULE: If a job has NO rows in this table, it is open to ALL branches.
-- ----------------------------------------------------------------------------
CREATE TABLE job_allowed_branches (
    job_id INT NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    branch VARCHAR(20) NOT NULL CHECK (branch IN ('CSE', 'ECE', 'ISE', 'MECH', 'CIVIL')),
    PRIMARY KEY (job_id, branch)
);

-- ----------------------------------------------------------------------------
-- 6. APPLICATIONS
-- Resolves the Student - Job M:N relationship.
-- Enforces one application per student per job (uq_student_job).
-- Status workflow: APPLIED -> SHORTLISTED -> INTERVIEW_SCHEDULED -> INTERVIEWED -> OFFERED -> ACCEPTED
-- ----------------------------------------------------------------------------
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    job_id INT NOT NULL REFERENCES job_listings(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'APPLIED' CHECK (status IN (
        'APPLIED',
        'SHORTLISTED',
        'INTERVIEW_SCHEDULED',
        'INTERVIEWED',
        'OFFERED',
        'ACCEPTED'
    )),
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_job UNIQUE (student_id, job_id)
);

-- ----------------------------------------------------------------------------
-- 7. INTERVIEW_SLOTS
-- Stores rounds scheduled for an application.
-- Enforces round_no unique per application.
-- ----------------------------------------------------------------------------
CREATE TABLE interview_slots (
    id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
    round_no INT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(150) NOT NULL,
    passed BOOLEAN DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    CONSTRAINT uq_app_round UNIQUE (application_id, round_no)
);

-- ----------------------------------------------------------------------------
-- 8. OFFERS
-- Stores offers made against an application.
-- Strict 1:0..1 relationship: UNIQUE(application_id).
-- Unpredictable offer_letter_key references document in object store.
-- ----------------------------------------------------------------------------
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    application_id INT UNIQUE NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
    package_lpa NUMERIC(6, 2) NOT NULL,
    offer_letter_key VARCHAR(255) UNIQUE NOT NULL,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. APPLICATION_STATUS_LOG (Audit Record)
-- Records every status change with actor and timestamp for accountability.
-- ----------------------------------------------------------------------------
CREATE TABLE application_status_log (
    id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10. ELIGIBILITY_DECISIONS
-- Stores the latest eligibility decision and reason for repeatability.
-- ----------------------------------------------------------------------------
CREATE TABLE eligibility_decisions (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    job_id INT NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    eligible BOOLEAN NOT NULL,
    reason TEXT NOT NULL,
    decided_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_job_decision UNIQUE (student_id, job_id)
);

-- ----------------------------------------------------------------------------
-- Performance Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_job_listings_company_id ON job_listings(company_id);
CREATE INDEX idx_job_listings_season ON job_listings(season);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_interview_slots_application_id ON interview_slots(application_id);
CREATE INDEX idx_status_log_application_id ON application_status_log(application_id);
CREATE INDEX idx_users_role ON users(role);

