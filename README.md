# TalentHub — University Campus Placement & Recruitment Management Portal

> **Comprehensive Full-Stack Implementation of Laboratory 4 AI-Assisted Detailed Design**  
> *Data Design (3NF / BCNF) • Algorithm Design (Fail-Fast Rule Engine) • Security & Privacy Design (JWT, DPDP, GDPR)*  
> Built with **React 19, TypeScript, Node.js / Express, PostgreSQL (PGlite / External), and WebSockets**.

---

## 📖 Table of Contents

1. [Executive Summary — What is TalentHub?](#-executive-summary--what-is-talenthub)
2. [Real-World Problem & Solution](#-real-world-problem--solution)
3. [User Roles & Key Features](#-user-roles--key-features)
4. [Lab 4 Detailed Design & Architectural Highlights](#-lab-4-detailed-design--architectural-highlights)
5. [Database Architecture (PostgreSQL 3NF / BCNF)](#-database-architecture-postgresql-3nf--bcnf)
6. [Critical Algorithm: `checkEligibility(student, job)`](#-critical-algorithm-checkeligibilitystudent-job)
7. [Step-by-Step Setup & How-to-Run Guide](#-step-by-step-setup--how-to-run-guide)
8. [Demo Accounts & Test Personas](#-demo-accounts--test-personas)
9. [API Reference & Realtime WebSocket Events](#-api-reference--realtime-websocket-events)
10. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🎯 Executive Summary — What is TalentHub?

**TalentHub** is a production-grade campus recruitment portal built for engineering colleges and universities (e.g., RV College of Engineering). It digitizes and automates the entire placement lifecycle across three core stakeholders:

- **Students**: Explore company placement drives, check instant real-time eligibility with transparent criteria, apply with one click, track interview rounds, view verifiable digital offer letters in-browser, and accept dream offers.
- **Company Recruiters**: Post job profiles with custom criteria (minimum CGPA, allowable branches, max active backlogs, annual CTC package), manage applicant pipelines across recruitment stages, schedule multi-round interviews, and issue official offer letters.
- **Placement Coordinators (TPO)**: Run automated batch shortlisting engines that enforce institutional guidelines, inspect the immutable audit trail of all candidate state transitions, track real-time placement stats across engineering branches, and enforce the **"1 Student = 1 Dream Placement"** university policy.

---

## 💡 Real-World Problem & Solution

### The Challenge
Campus placements involve thousands of students, tens of academic branches, and hundreds of visiting tech giants (Google, Microsoft, Amazon, Cisco). In typical universities:
- Eligibility rules are complex and prone to human error or manual manipulation.
- Students who receive an offer often continue applying, blocking peers from getting opportunities (offer hoarding).
- Document handling is messy: unverified mock files, untracked changes, or insecure download links.
- Regulatory privacy guidelines (DPDP Act 2023, GDPR) mandate student consent and right-to-erasure that traditional legacy systems ignore.

### The TalentHub Solution
1. **Mathematical Fairness (BCNF/3NF)**: Built upon a strictly normalized relational database schema with candidate keys and database-level `CHECK` constraints preventing any duplicate applications, double offers, or inconsistent states.
2. **Fail-Fast Eligibility Algorithm**: An exact, sequential $R_1 \to R_2 \to R_3 \to R_4$ rule evaluation engine that immediately returns the exact human-readable reason if a student is ineligible.
3. **Atomic Offer Acceptance Guarantee**: When a student accepts a placement offer, the system executes an atomic database transaction that updates the offer, locks the student profile (`has_accepted_offer = true`), transitions application status to `ACCEPTED`, and appends an immutable audit log.
4. **Verifiable In-Browser Offer Document Viewer**: Digital offer letters are stored with cryptographically unpredictable UUID keys (`offer_<uuid>.pdf`), previewed instantly inside a clean modal with interactive PDF rendering, and downloaded as authentic, compliant PDF-1.4 documents.
5. **Modern Executive UI**: Crafted in a clean, executive light theme (slate-50 canvas, elevated white cards, crisp typography, and zero distracting emojis) with real-time WebSocket live updates.

---

## 👥 User Roles & Key Features

```mermaid
flowchart LR
    A[TalentHub Ecosystem] --> S[Student Persona]
    A --> C[Company Recruiter]
    A --> T[TPO Coordinator]

    S --> S1[Browse Drives]
    S --> S2[Live Eligibility Check]
    S --> S3[Interview Tracker]
    S --> S4[View & Accept Offer]
    S --> S5[Consent & GDPR Erasure]

    C --> C1[Post Recruitment Drives]
    C --> C2[Applicant Pipeline]
    C --> C3[Schedule Interview Rounds]
    C --> C4[Generate & Issue Offers]

    T --> T1[Batch Shortlisting Engine]
    T --> T2[Branch Placement Analytics]
    T --> T3[Immutable Audit Trail]
    T --> T4[Policy Enforcement]
```

### 1. Student Portal (`/dashboard/student`)
- **Live Drive Catalog**: View open recruitment drives from Google, Microsoft, Amazon, Cisco, etc.
- **Dynamic Eligibility Evaluation**: Clear green/amber badges explaining whether you qualify (e.g. *"Eligible — All criteria met"* vs *"Ineligible — 1 active backlog exceeds drive maximum 0"*).
- **One-Click Application**: Apply directly; duplicate applications are prevented at both UI and database constraints.
- **Live Interview Pipeline**: Track interview rounds (Round 1 Technical, Round 2 System Design, HR), timestamps, and venue.
- **Offer Letter Viewer & Acceptance**: View your formal letter of appointment right on screen inside an interactive PDF viewer modal, open in a new tab, print, or download as an authentic PDF.
- **Data Privacy & GDPR Controls**: Toggle placement data sharing consent; perform one-click Right to Erasure (anonymizes name and USN while preserving institutional placement counts).

### 2. Company Recruiter Portal (`/dashboard/company`)
- **Post Recruitment Drives**: Specify role designation, drive dates, minimum CGPA cutoff, maximum allowable backlogs, branch scope, and CTC (LPA).
- **Recruitment Pipeline Management**: Review applicants categorized by status: `APPLIED` &rarr; `SHORTLISTED` &rarr; `INTERVIEW_SCHEDULED` &rarr; `INTERVIEWED` &rarr; `OFFERED` &rarr; `ACCEPTED`.
- **Multi-Round Interview Scheduler**: Schedule specific interview rounds with venue / video link and custom notes.
- **Formal Offer Issuance**: Issue formal offers with custom package CTC and automated valid PDF offer generation.

### 3. Placement Coordinator Portal (`/dashboard/coordinator`)
- **Automated Batch Shortlisting**: With one click, the system iterates over all applicants across all drives, applies the sequential eligibility rules, promotes eligible students to `SHORTLISTED`, and logs each decision.
- **Placement Intelligence Dashboard**: Real-time progress bars showing placement percentages across branches (CSE, ISE, ECE, MECH, CIVIL) and top recruiting partners.
- **Immutable Audit Trail**: Transparent log of every state change (`APPLIED` &rarr; `SHORTLISTED` &rarr; `OFFERED`), timestamp, and acting user ID.

---

## 🏛️ Lab 4 Detailed Design & Architectural Highlights

TalentHub strictly fulfills the formal Architectural Decision Records (ADRs) defined in the Lab 4 AI-Assisted Detailed Design specification:

| Lab 4 Design Area | Implementation Detail | Source File Link |
| :--- | :--- | :--- |
| **Layered Architecture (ADR-001)** | Clean separation: `routes` &rarr; `controllers` &rarr; `services` &rarr; `repositories` &rarr; `db` | `server/src/` |
| **Relational Data Design (ADR-002)** | Strict 3NF / BCNF normalization across 10 tables with foreign keys and `CHECK` constraints | `server/src/db/schema.sql` |
| **Authentication & RBAC (ADR-003)** | Stateless JWT with salted bcrypt password hashing and role-based route middleware | `server/src/middleware/authMiddleware.ts` |
| **Dual Storage Model (ADR-004 / Option B)** | Metadata in PostgreSQL; offer documents in file store referenced by unpredictable UUID keys | `server/src/services/storageService.ts` |
| **Sequential Eligibility Engine** | Deterministic $R_1 \to R_2 \to R_3 \to R_4$ rule evaluation matching doc specification | `server/src/algorithms/checkEligibility.ts` |
| **Atomic Acceptance (NFR-8.4)** | PostgreSQL transaction guarantees 1 student cannot accept multiple offers | `server/src/services/offerService.ts` |
| **Audit Log & DPDP Privacy** | Immutable `application_status_log`, consent toggle, and in-place GDPR erasure | `server/src/repositories/auditRepository.ts` |
| **Realtime WebSockets** | WebSocket event broadcast engine updates client UI across roles without refresh | `server/src/realtime/index.ts` |

---

## 📊 Database Architecture (PostgreSQL 3NF / BCNF)

The relational schema is fully normalized into Third Normal Form (3NF) and Boyce-Codd Normal Form (BCNF), eliminating redundancy, update anomalies, and insertion anomalies:

```
+---------------------------------------------------------------------------------------+
|                                TALENTHUB RELATIONAL SCHEMA                            |
+---------------------------------------------------------------------------------------+

  students (id, usn [UQ], full_name, email [UQ], branch, cgpa, active_backlogs, ...)
     ▲                                                         ▲
     │                                                         │
  users (id, username [UQ], role, student_id [FK], company_id [FK])
                                                         ▲
  companies (id, company_name [UQ], description, website) │
     ▲                                                   │
     │                                                   │
  job_listings (id, company_id [FK], role, season, min_cgpa, max_backlogs, package_lpa)
     │        ▲
     │        └── job_allowed_branches (job_id [FK], branch) [PK: composite]
     ▼
  applications (id, student_id [FK], job_id [FK], status, applied_at, updated_at) [UQ: student_id + job_id]
     │        ▲
     │        ├── interview_slots (id, application_id [FK], round_no, scheduled_at, venue) [UQ: app + round]
     │        ├── offers (id, application_id [FK, UQ], package_lpa, offer_letter_key [UQ], accepted)
     │        └── application_status_log (id, application_id [FK], from_status, to_status, changed_by, changed_at)
     ▼
  eligibility_decisions (id, student_id [FK], job_id [FK], eligible, reason, decided_at)
```

### Table Definitions & Constraints
1. **`students`**: Primary key `id`. Unique candidate keys on `usn` and `email`. Constraints: `cgpa BETWEEN 0 AND 10`, `active_backlogs >= 0`, `branch IN ('CSE', 'ECE', 'ISE', 'MECH', 'CIVIL')`.
2. **`companies`**: Primary key `id`. Unique candidate key on `company_name`.
3. **`users`**: Authentication table with hashed passwords, user roles (`student`, `company`, `coordinator`), and optional foreign keys to `students` or `companies`.
4. **`job_listings`**: Active recruitment drives linked to `company_id`.
5. **`job_allowed_branches`**: Bridges job drives to allowable academic disciplines. *Rule: An empty branch list signifies that the drive is open to all engineering disciplines.*
6. **`applications`**: Represents student candidatures. Unique constraint on `(student_id, job_id)` prevents duplicate applications.
7. **`interview_slots`**: Tracks sequential rounds. Unique constraint on `(application_id, round_no)`.
8. **`offers`**: Unique 1:1 relationship with `application_id`. Stores unpredictable UUID storage key (`offer_<uuid>.pdf`) and acceptance boolean.
9. **`application_status_log`**: Append-only immutable table capturing every transition with timestamp and user ID.
10. **`eligibility_decisions`**: Cached eligibility outcomes evaluated by the automated engine.

---

## ⚡ Critical Algorithm: `checkEligibility(student, job)`

Implemented in `server/src/algorithms/checkEligibility.ts`:

```typescript
export function checkEligibility(
  student: StudentProfile,
  job: JobCriteria
): EligibilityResult {
  // R1: CGPA Cutoff (Inclusive boundary)
  if (student.cgpa < job.min_cgpa) {
    return {
      eligible: false,
      reason: `CGPA ${student.cgpa.toFixed(2)} is below minimum requirement of ${job.min_cgpa.toFixed(2)}`,
    };
  }

  // R2: Active Backlogs Limit (Inclusive boundary)
  if (student.active_backlogs > job.max_backlogs) {
    return {
      eligible: false,
      reason: `Active backlogs (${student.active_backlogs}) exceed maximum allowed (${job.max_backlogs})`,
    };
  }

  // R3: University Placement Policy (1 Student = 1 Offer)
  if (student.has_accepted_offer) {
    return {
      eligible: false,
      reason: 'Already accepted an offer this placement season (Placement Policy rule)',
    };
  }

  // R4: Eligible Branches Scope (Empty array = open to all branches)
  if (job.allowed_branches && job.allowed_branches.length > 0) {
    if (!job.allowed_branches.includes(student.branch)) {
      return {
        eligible: false,
        reason: `Branch ${student.branch} is not eligible for this role (Allowed: ${job.allowed_branches.join(', ')})`,
      };
    }
  }

  return {
    eligible: true,
    reason: 'All eligibility criteria satisfied',
  };
}
```

### Algorithm Test Suite
Run the test suite verifying all 10 edge cases:
```bash
npm test --prefix server
```
- CGPA exactly at cutoff &rarr; Eligible
- CGPA 0.01 below cutoff &rarr; Ineligible
- Backlogs exactly at maximum &rarr; Eligible
- Backlogs 1 over maximum &rarr; Ineligible
- Student with existing accepted offer &rarr; Ineligible (policy block)
- Open to all branches (empty branch list) &rarr; Eligible

---

## 🚀 Step-by-Step Setup & How-to-Run Guide

> [!IMPORTANT]
> **Zero-Config Guarantee — Runs Without Any `.env` File or External Database!**
> - You do **NOT** need to create or configure any `.env` file. All environment variables have resilient, built-in defaults.
> - You do **NOT** need to install, configure, or run an external PostgreSQL server or Docker container. TalentHub uses an **embedded, zero-config PostgreSQL engine (PGlite)** that starts automatically out of the box on Windows, macOS, and Linux!
> - Simply follow the 4 commands below and the entire application will be live in under 2 minutes.

### Prerequisites
- **Node.js**: Version 20.x, 22.x, or 24.x ([Download Node.js](https://nodejs.org/))
- **Git**

---

### Quick 3-Step Start (Copy & Paste)

```bash
# 1. Clone the repository
git clone https://github.com/manasa-vasare/talenthub-node-aisd.git
cd talenthub-node-aisd

# 2. Install dependencies (standard npm)
npm install --prefix server
npm install --prefix client

# 3. Seed database with sample students, drives & offer letters
npm run db:seed --prefix server
```

Then start the servers:

- **In Terminal 1 (Backend Server on Port 5000):**
  ```bash
  npm run dev --prefix server
  ```
- **In Terminal 2 (Frontend UI on Port 5173):**
  ```bash
  npm run dev --prefix client
  ```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

### Detailed Step-by-Step Instructions

#### Step 1: Clone the Repository
```bash
git clone https://github.com/manasa-vasare/talenthub-node-aisd.git
cd talenthub-node-aisd
```

---

#### Step 2: Install Dependencies

##### Option A: Using standard npm (Default / Recommended)
```bash
npm install --prefix server
npm install --prefix client
```

##### Option B: Using pnpm (If you have pnpm installed)
```bash
pnpm install
```

---

### Step 3: Seed the Database with Realistic Placement Data

Run the migration and seeding script. This initializes the 10 relational tables and creates sample students, companies, job listings, interview rounds, and valid offer letters:

```bash
# Using npm:
npm run db:seed --prefix server

# Or using pnpm:
pnpm db:seed
```

You will see:
```text
--- SEEDING TALENT HUB DATABASE ---
[DB] Embedded PostgreSQL engine (PGlite) active
--- RUNNING DATABASE MIGRATIONS ---
✓ Successfully applied schema.sql (10 tables, indexes, constraints created)
Seeding Students...
Seeding Companies...
Seeding Users...
Seeding Job Listings...
Seeding Applications & Workflows...
✓ Database seeded successfully with realistic data!
```

---

### Step 4: Run the Application

You can start the backend and frontend in two separate terminal tabs:

#### Terminal 1 — Start Backend Server (Port 5000)
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

#### Terminal 2 — Start Frontend Application (Port 5173)
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

Now open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

### Running Production Build (Single Command)
To compile and serve both frontend and backend as a unified production app:
```bash
npm run build --prefix client
npm run build --prefix server
npm run start --prefix server
# Open http://localhost:5000
```

---

## 🔑 Demo Accounts & Test Personas

You can sign in with any of these pre-seeded demo personas, or use the **"Quick Demo Login"** buttons on the login page:

| Persona | Role | Username | Password | Purpose & Scenario |
| :--- | :--- | :--- | :--- | :--- |
| **Priya Patel** | Student | `priya` | `student123` | **Offer Review**: ISE student with 9.15 CGPA. Has an active formal placement offer from **Microsoft (24 LPA)**. Click "Placement Offers" to view and download the offer letter! |
| **Rahul Sharma** | Student | `rahul` | `student123` | **Drive Explorer**: CSE student with 8.2 CGPA and 1 backlog. Eligible for Microsoft and Amazon; blocked from Google due to backlog limit. |
| **Sneha K** | Student | `sneha` | `student123` | **Placed Student**: CSE student with 9.6 CGPA. Already accepted **Google (32.5 LPA)**. Blocked from applying to other drives per the university policy. |
| **Microsoft HR** | Recruiter | `microsoft_hr` | `company123` | **Recruiter Pipeline**: Manage the Cloud Solutions Architect drive, schedule candidate rounds, and issue offers. |
| **Google HR** | Recruiter | `google_hr` | `company123` | **Recruiter Pipeline**: Review CSE applicants for Distributed Systems Engineer. |
| **Placement Officer** | Coordinator | `coordinator` | `admin123` | **TPO Admin**: Execute the automated bulk shortlisting engine, view branch placement charts, and inspect audit logs. |

> **Self-Registration**: New students and recruiters can also create brand-new accounts directly using the **"Register Student"** or **"Register Recruiter"** tabs on the login screen.

---

## 📄 Offer Letter Document Architecture

Offer letter documents follow the **Dual Storage Model (Option B / ADR-004)**:
- Relational metadata (`application_id`, `package_lpa`, `accepted`, `issued_at`) is stored in the `offers` table in PostgreSQL.
- The document binary is stored on disk with a cryptographically unpredictable key format: `offer_<uuid>.pdf`.
- Role-based authorization ensures students can only access their own offer documents, and companies can only access documents issued by their team.
- **In-Browser Preview**: When clicking **"View Letter"**, the app loads the authenticated PDF stream via an inline object URL and embeds it in an interactive modal.
- **Authentic PDF Generation**: The system includes a built-in standard-compliant PDF-1.4 generator that produces non-corrupted PDF documents complete with college letterhead, terms, and authorized signatory sections.

---

## 🌐 API Reference & Realtime WebSocket Events

### Core REST Endpoints

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates user and returns JWT token |
| `POST` | `/api/auth/register/student` | Public | Self-registration for new students |
| `POST` | `/api/auth/register/company` | Public | Self-registration for new recruiting partners |
| `GET` | `/api/jobs` | Authenticated | Lists open campus recruitment drives |
| `POST` | `/api/student/apply` | Student | Submits candidature for a job drive |
| `GET` | `/api/student/offers` | Student | Lists placement offers issued to logged-in student |
| `GET` | `/api/offers/document/:key` | Student / Company / TPO | Streams or downloads verifiable offer letter PDF |
| `POST` | `/api/offers/:appId/accept` | Student | Atomically accepts offer and locks student placement |
| `POST` | `/api/offers/issue` | Company / TPO | Issues formal placement offer with salary package |
| `POST` | `/api/coordinator/shortlist/batch` | Coordinator | Executes rule-based automated batch shortlisting |
| `GET` | `/api/coordinator/audit-log` | Coordinator | Retrieves immutable chronological audit transitions |
| `PUT` | `/api/student/consent` | Student | Toggles placement data sharing consent (DPDP) |
| `POST` | `/api/student/erase` | Student | Executes GDPR / DPDP in-place anonymization |

### Realtime WebSocket Broadcasts (`ws://localhost:5000/ws`)
- `APPLICATION_STATUS_CHANGED`: Emitted when a student's status changes.
- `INTERVIEW_SCHEDULED`: Emitted when an interview slot is booked or updated.
- `OFFER_ISSUED`: Emitted when a company extends an offer letter.
- `OFFER_ACCEPTED`: Emitted when a student accepts an offer, instantly refreshing recruiter pipelines and placement charts.

---

## 🛠️ Troubleshooting & FAQ

#### Q: The browser says "Address already in use :::5000" or :::5173.
Another node process is running on that port. Run the following in PowerShell:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

#### Q: How do I test the offer letter viewing?
1. Sign in as **Priya Patel** (`priya` / `student123`).
2. Click the **Placement Offers** tab.
3. Click **"View Letter"** to inspect the interactive PDF right inside the modal.
4. Click **"Download PDF"** to save the valid PDF file to your computer and open it with Adobe Acrobat or Chrome.

#### Q: Do I need to install PostgreSQL separately?
No! TalentHub automatically uses its embedded PGlite engine. If you want to use a production PostgreSQL database, create a `.env` file containing:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/talenthub
```

---

## 👩‍💻 Authors & Academic Context

- **Course**: Artificial Intelligence in System Design (AISD)
- **Laboratory Assignment**: Lab 4 — AI-Assisted Detailed Design
- **Institution**: Department of Computer Science & Information Science, RVCE
- **Repository**: [https://github.com/manasa-vasare/talenthub-node-aisd.git](https://github.com/manasa-vasare/talenthub-node-aisd.git)
