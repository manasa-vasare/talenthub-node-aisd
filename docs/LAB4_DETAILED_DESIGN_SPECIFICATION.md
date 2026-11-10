# Laboratory 4: AI-Assisted Detailed Design
## Data Design • Algorithm Design • Security Design
### Comprehensive Technical Design Specification & Consolidated Detailed Design Record (DDR)

---

## 1. Executive Context & Method

| Parameter | Specification |
| :--- | :--- |
| **Course** | Artificial Intelligence in System Design (AISD) — Laboratory 4 |
| **System** | TalentHub — Campus Placement & Recruitment Management System |
| **Method** | Design Need &rarr; AI Alternatives &rarr; AI Silent Decision &rarr; Student Review (ACCEPT / MODIFY / REJECT) &rarr; Final Design |
| **Deliverable** | Consolidated Detailed Design Record (DDR) plus complete relational data, algorithm, and security artifacts |

---

## 2. Part A – Data Design & Storage Model

### A1. Storage Alternatives & Decision

| Option | Design | When Suitable | Evaluation & Decision |
| :---: | :--- | :--- | :--- |
| **A** | RDBMS only | Structured relationships, integrity, ACID transactions | Clean, but embeds file blobs into database rows. |
| **B** | **RDBMS + File/Object Store** | Relational records plus substantial documents or files | **Student Decision: ACCEPT B (Option chosen)**. Relational placement data stored in PostgreSQL; offer letters stored as files referenced by `offers.offer_letter_key` (UNIQUE). |
| **C** | RDBMS + Specialized Store | Vector embeddings, semantic search, or graph queries | **REJECTED**: No vector or semantic-search requirement approved. |

### A2. Data Map & Source of Truth

| Data Entity | Storage System | Source of Truth |
| :--- | :--- | :--- |
| Students, Companies, Job Listings, Allowed Branches, Applications, Interviews, Offers (records) | Relational Database (PostgreSQL / PGlite) | Relational Database (ACID) |
| Digital Offer Letter Documents | File / Object Store (`uploads/offers/`) | File Store; RDBMS stores only `offer_letter_key` |

---

## 3. Relational Schema & Normalization Walkthrough (1NF &rarr; 2NF &rarr; 3NF &rarr; BCNF)

### 3.1 First Normal Form (1NF)
- **1NF Condition**: Every attribute contains only atomic values (no repeating groups, lists, or multi-valued fields).
- **Decomposition**: The original design stored `allowed_branches` as a comma-separated list inside `job_listings`. This violated 1NF.
- **Resolution**: Decomposed into `job_allowed_branches(job_id, branch)` with composite primary key `(job_id, branch)`. A job with zero rows in this table indicates it is open to all engineering disciplines.

### 3.2 Second Normal Form (2NF)
- **2NF Condition**: In 1NF and no non-key attribute depends on only part of a composite candidate key (no partial functional dependency).
- **Verification**:
  - `job_allowed_branches(job_id, branch)` has no non-key columns, so no partial dependency is possible.
  - In `applications`, the candidate key is `(student_id, job_id)`. The status and timestamps depend on the whole pair, not on `student_id` alone or `job_id` alone.
  - All other relations possess single-attribute primary keys (`id`), precluding partial dependencies. Satisfies 2NF.

### 3.3 Third Normal Form (3NF)
- **3NF Condition**: In 2NF and no non-key attribute transitively depends on the primary key via another non-key attribute ($X \to Y \to Z$).
- **Verification**:
  - Company details live strictly in `companies`; `job_listings` holds only `company_id` (FK), avoiding `job_id -> company_id -> company_name`.
  - Student academic data lives strictly in `students`; `applications` holds only `student_id` (FK).
  - Every non-key attribute directly depends on the candidate key. Satisfies 3NF.

### 3.4 Boyce-Codd Normal Form (BCNF)
- **BCNF Condition**: For every non-trivial functional dependency $X \to Y$, the determinant $X$ must be a superkey of the relation.
- **Verification**:
  - `students`: `id`, `usn`, and `email` are all superkeys.
  - `companies`: `id` and `company_name` are superkeys.
  - `job_listings`: `id` is a superkey.
  - `job_allowed_branches`: `(job_id, branch)` is a superkey.
  - `applications`: `id` and `(student_id, job_id)` are superkeys.
  - `interview_slots`: `id` and `(application_id, round_no)` are superkeys.
  - `offers`: `id`, `application_id`, and `offer_letter_key` are superkeys.
  - Every determinant is a candidate key. Satisfies BCNF.

---

## 4. Entity-Relationship Model (7 Core Relational Tables)

```
COMPANIES (1) ──< (N) JOB_LISTINGS (1) ──< (N) JOB_ALLOWED_BRANCHES
                           │
                           └──< (N) APPLICATIONS (N) >── (1) STUDENTS
                                        │
                                        ├──< (N) INTERVIEW_SLOTS
                                        └──< (0..1) OFFERS
```

### Table Definitions & Constraints

```sql
-- 1. Students
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    usn VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    branch VARCHAR(50) NOT NULL CHECK (branch IN ('CSE', 'ECE', 'ISE', 'MECH', 'CIVIL')),
    cgpa DECIMAL(4, 2) NOT NULL CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    active_backlogs INT NOT NULL DEFAULT 0 CHECK (active_backlogs >= 0),
    has_accepted_offer BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2. Companies
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) UNIQUE NOT NULL
);

-- 3. Job Listings
CREATE TABLE job_listings (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id),
    role VARCHAR(100) NOT NULL,
    season VARCHAR(20) NOT NULL,
    min_cgpa DECIMAL(4, 2) NOT NULL CHECK (min_cgpa >= 0.00 AND min_cgpa <= 10.00),
    max_backlogs INT NOT NULL DEFAULT 0 CHECK (max_backlogs >= 0),
    drive_date DATE NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Job Allowed Branches (1NF Decomposed)
CREATE TABLE job_allowed_branches (
    job_id INT NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    branch VARCHAR(50) NOT NULL,
    PRIMARY KEY (job_id, branch)
);

-- 5. Applications (Student - Job M:N Resolver)
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id),
    job_id INT NOT NULL REFERENCES job_listings(id),
    status VARCHAR(20) NOT NULL DEFAULT 'APPLIED',
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_job UNIQUE (student_id, job_id)
);

-- 6. Interview Slots
CREATE TABLE interview_slots (
    id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES applications(id),
    round_no INT NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    venue VARCHAR(150) NOT NULL,
    passed BOOLEAN NULL,
    notes TEXT NULL,
    CONSTRAINT uq_app_round UNIQUE (application_id, round_no)
);

-- 7. Offers (1:0..1 Cardinality)
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    application_id INT UNIQUE NOT NULL REFERENCES applications(id),
    package_lpa DECIMAL(6, 2) NOT NULL,
    offer_letter_key VARCHAR(255) UNIQUE NOT NULL,
    accepted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

## 5. Part B & E – Critical Algorithm: `checkEligibility(student, job)`

### 5.1 Inputs, Preconditions & Edge Cases
- **Inputs**: `student (cgpa, active_backlogs, branch, has_accepted_offer)`, `job (min_cgpa, max_backlogs, is_open, allowed_branches)`.
- **Preconditions**: Student and job exist; `cgpa BETWEEN 0 AND 10`; `active_backlogs >= 0`.
- **Output**: `(eligible: boolean, reasons: string[])`.
- **Boundary Constraints**:
  - CGPA boundary is inclusive (`student.cgpa >= job.min_cgpa`).
  - Backlogs boundary is inclusive (`student.active_backlogs <= job.max_backlogs`).
  - Empty allowed-branch rows means open to all engineering disciplines.
- **Alternatives & Trade-offs**:
  - *Option A*: Sequential fail-fast checks (reports only first failure).
  - *Option B*: Evaluate all applicable checks (reports every failure reason).
  - *Student Decision*: **ACCEPT B**. Students must see all criteria they fail to satisfy.

### 5.2 Algorithm Pseudocode

```text
FUNCTION checkEligibility(student, job)
  reasons = empty list
  IF job.is_open == false THEN add "Job is closed" to reasons
  IF student.cgpa < job.min_cgpa THEN add "CGPA below minimum" to reasons
  IF student.active_backlogs > job.max_backlogs THEN add "Too many active backlogs" to reasons
  branches = allowed branches of job
  IF branches is not empty AND student.branch NOT IN branches THEN add "Branch not allowed" to reasons
  IF placement policy approved AND student.has_accepted_offer == true THEN add "Already placed" to reasons
  RETURN (reasons is empty, reasons)
END FUNCTION
```

---

## 6. Part C & F – Security Design

| Security Area | Selected Control | Rationale & Trade-off |
| :--- | :--- | :--- |
| **Authentication & Authorization** | Token-based authentication (JWT) with server-side role checks (`student`, `company`, `coordinator`). | Stateless architecture fits decoupled SPA frontend. Authorization decisions are enforced in backend middleware, never trusted from client. |
| **Sensitive-Data Protection** | Role-based field filtering in service layer. | Prevents exposure of student contact info, CGPA, and backlogs to unauthorized companies or external users. |
| **Integrity & Audit Logging** | Role-authorized status changes; logging of sensitive state transitions in `application_status_log`. | Prevents tampering with placement records while keeping audit log overhead focused and performant. |

---

## 7. Part G – Consolidated Detailed Design Record (DDR)

| Design Area | AI Silent Decision | Student Decision | Action | Rationale |
| :--- | :--- | :--- | :---: | :--- |
| **Data Design** | Option B: RDBMS + object store; 7-table schema in 3NF/BCNF | RDBMS for all records; object store used only for offer letters referenced by `offer_letter_key` | **MODIFY** | Avoids unnecessary vector/graph infrastructure. `has_accepted_offer` synchronized atomically with `offers.accepted`. |
| **Algorithm** | `checkEligibility` Alternative B (evaluate all rules) | Evaluate all rules and return complete list of failure reasons; inclusive boundaries | **ACCEPT** | Provides clear, complete feedback to students. |
| **Security** | Role checks, controlled field exposure, selective audit | Server-side role authorization, role-based field filtering, audit log for state transitions | **ACCEPT** | Protects placement records without introducing unapproved full audit complexity. |

### DDR Validation Verification

| Check | Expected Result | Implementation Status | Evidence in Codebase |
| :--- | :---: | :---: | :--- |
| **Consistent with approved requirements** | PASS | **PASS** | 7 entities, attributes, and constraints match Lab 4 schema. |
| **Consistent with Lab 3 architecture & ADRs** | PASS | **PASS** | Layered design: `routes/` &rarr; `controllers/` &rarr; `services/` &rarr; `repositories/` &rarr; `db/`. |
| **Unsupported AI assumptions removed/clarified** | PASS | **PASS** | Vector store rejected; offer letters stored as file references. |
| **Sufficiently detailed for code generation** | PASS | **PASS** | Complete SQL, constraints, algorithm pseudocode, and tests passing. |
