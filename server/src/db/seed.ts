import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, query, closeDb, withTransaction } from './connection.js';
import { runMigrations } from './migrate.js';
import { config } from '../config/index.js';
import { generateOfferPdfBuffer } from '../services/storageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  console.log('--- SEEDING TALENT HUB DATABASE ---');
  await initDb();
  await runMigrations();

  const saltRounds = 10;
  const hashPassword = (pw: string) => bcrypt.hashSync(pw, saltRounds);

  // Ensure offer uploads directory exists
  if (!fs.existsSync(config.storagePath)) {
    fs.mkdirSync(config.storagePath, { recursive: true });
  }

  // Create sample valid offer letter PDF files
  const sampleOffer1Key = 'offer-google-sneha-2026.pdf';
  const sampleOffer2Key = 'offer-msft-priya-2026.pdf';
  fs.writeFileSync(
    path.join(config.storagePath, sampleOffer1Key),
    generateOfferPdfBuffer({
      companyName: 'Google India',
      studentName: 'Sneha K',
      usn: '1RV22CS088',
      branch: 'CSE',
      role: 'Software Engineer - Distributed Systems',
      packageLpa: 32.5,
      dateStr: '20/09/2026',
      storageKey: sampleOffer1Key,
    })
  );
  fs.writeFileSync(
    path.join(config.storagePath, sampleOffer2Key),
    generateOfferPdfBuffer({
      companyName: 'Microsoft Corporation',
      studentName: 'Priya Patel',
      usn: '1RV22IS045',
      branch: 'ISE',
      role: 'Cloud Solutions Architect',
      packageLpa: 24.0,
      dateStr: '20/10/2026',
      storageKey: sampleOffer2Key,
    })
  );

  await withTransaction(async (tx) => {
    // 1. Seed Students
    console.log('Seeding Students...');
    const studentsData = [
      {
        usn: '1RV22CS001',
        full_name: 'Rahul Sharma',
        email: 'rahul.cs22@rvce.edu.in',
        branch: 'CSE',
        cgpa: 8.2,
        active_backlogs: 1,
        cleared_backlogs: 1,
        has_accepted_offer: false,
        consent_given: true,
        consent_at: new Date('2026-08-01T10:00:00Z'),
      },
      {
        usn: '1RV22IS045',
        full_name: 'Priya Patel',
        email: 'priya.is22@rvce.edu.in',
        branch: 'ISE',
        cgpa: 9.15,
        active_backlogs: 0,
        cleared_backlogs: 0,
        has_accepted_offer: false,
        consent_given: true,
        consent_at: new Date('2026-08-01T10:30:00Z'),
      },
      {
        usn: '1RV22EC012',
        full_name: 'Ananya Rao',
        email: 'ananya.ec22@rvce.edu.in',
        branch: 'ECE',
        cgpa: 7.8,
        active_backlogs: 0,
        cleared_backlogs: 0,
        has_accepted_offer: false,
        consent_given: true,
        consent_at: new Date('2026-08-02T09:15:00Z'),
      },
      {
        usn: '1RV22ME030',
        full_name: 'Karthik Nair',
        email: 'karthik.me22@rvce.edu.in',
        branch: 'MECH',
        cgpa: 6.85,
        active_backlogs: 1,
        cleared_backlogs: 2,
        has_accepted_offer: false,
        consent_given: true,
        consent_at: new Date('2026-08-02T11:00:00Z'),
      },
      {
        usn: '1RV22CV005',
        full_name: 'Vikram Singh',
        email: 'vikram.cv22@rvce.edu.in',
        branch: 'CIVIL',
        cgpa: 6.45,
        active_backlogs: 0,
        cleared_backlogs: 0,
        has_accepted_offer: false,
        consent_given: true,
        consent_at: new Date('2026-08-03T14:20:00Z'),
      },
      {
        usn: '1RV22CS088',
        full_name: 'Sneha K',
        email: 'sneha.cs22@rvce.edu.in',
        branch: 'CSE',
        cgpa: 9.6,
        active_backlogs: 0,
        cleared_backlogs: 0,
        has_accepted_offer: true, // Already accepted offer at Google!
        consent_given: true,
        consent_at: new Date('2026-07-25T08:00:00Z'),
      },
    ];

    const studentMap: Record<string, number> = {};
    for (const s of studentsData) {
      const res = await tx.query(
        `INSERT INTO students (usn, full_name, email, branch, cgpa, active_backlogs, cleared_backlogs, has_accepted_offer, consent_given, consent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          s.usn,
          s.full_name,
          s.email,
          s.branch,
          s.cgpa,
          s.active_backlogs,
          s.cleared_backlogs,
          s.has_accepted_offer,
          s.consent_given,
          s.consent_at,
        ]
      );
      studentMap[s.usn] = res.rows[0].id;
    }

    // 2. Seed Companies
    console.log('Seeding Companies...');
    const companiesData = [
      {
        company_name: 'Google India',
        description: 'Global technology leader in search, cloud computing, AI, and advertising.',
        website: 'https://careers.google.com',
      },
      {
        company_name: 'Microsoft Corporation',
        description: 'Empowering every person and every organization on the planet to achieve more.',
        website: 'https://careers.microsoft.com',
      },
      {
        company_name: 'Amazon Development Centre',
        description: 'Earth’s most customer-centric company, innovating across e-commerce and AWS.',
        website: 'https://amazon.jobs',
      },
      {
        company_name: 'Cisco Systems',
        description: 'Worldwide technology leader transforming network connectivity and cybersecurity.',
        website: 'https://jobs.cisco.com',
      },
    ];

    const companyMap: Record<string, number> = {};
    for (const c of companiesData) {
      const res = await tx.query(
        `INSERT INTO companies (company_name, description, website)
         VALUES ($1, $2, $3) RETURNING id`,
        [c.company_name, c.description, c.website]
      );
      companyMap[c.company_name] = res.rows[0].id;
    }

    // 3. Seed Users
    console.log('Seeding Users...');
    const usersData = [
      // Coordinator
      {
        username: 'coordinator',
        password_hash: hashPassword('admin123'),
        role: 'coordinator',
        student_id: null,
        company_id: null,
      },
      // Company HRs
      {
        username: 'google_hr',
        password_hash: hashPassword('company123'),
        role: 'company',
        student_id: null,
        company_id: companyMap['Google India'],
      },
      {
        username: 'microsoft_hr',
        password_hash: hashPassword('company123'),
        role: 'company',
        student_id: null,
        company_id: companyMap['Microsoft Corporation'],
      },
      {
        username: 'amazon_hr',
        password_hash: hashPassword('company123'),
        role: 'company',
        student_id: null,
        company_id: companyMap['Amazon Development Centre'],
      },
      {
        username: 'cisco_hr',
        password_hash: hashPassword('company123'),
        role: 'company',
        student_id: null,
        company_id: companyMap['Cisco Systems'],
      },
      // Students
      {
        username: 'rahul',
        password_hash: hashPassword('student123'),
        role: 'student',
        student_id: studentMap['1RV22CS001'],
        company_id: null,
      },
      {
        username: 'priya',
        password_hash: hashPassword('student123'),
        role: 'student',
        student_id: studentMap['1RV22IS045'],
        company_id: null,
      },
      {
        username: 'ananya',
        password_hash: hashPassword('student123'),
        role: 'student',
        student_id: studentMap['1RV22EC012'],
        company_id: null,
      },
      {
        username: 'karthik',
        password_hash: hashPassword('student123'),
        role: 'student',
        student_id: studentMap['1RV22ME030'],
        company_id: null,
      },
      {
        username: 'vikram',
        password_hash: hashPassword('student123'),
        role: 'student',
        student_id: studentMap['1RV22CV005'],
        company_id: null,
      },
      {
        username: 'sneha',
        password_hash: hashPassword('student123'),
        role: 'student',
        student_id: studentMap['1RV22CS088'],
        company_id: null,
      },
    ];

    const userMap: Record<string, number> = {};
    for (const u of usersData) {
      const res = await tx.query(
        `INSERT INTO users (username, password_hash, role, student_id, company_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [u.username, u.password_hash, u.role, u.student_id, u.company_id]
      );
      userMap[u.username] = res.rows[0].id;
    }

    // 4. Seed Job Listings & Allowed Branches
    console.log('Seeding Job Listings...');
    const jobsData = [
      {
        company_id: companyMap['Google India'],
        role: 'Software Engineer - Distributed Systems',
        season: '2026-2027',
        min_cgpa: 8.0,
        max_backlogs: 0,
        drive_date: '2026-11-15',
        is_open: true,
        package_lpa: 32.5,
        description: 'Building planetary-scale backend services and cloud infrastructure.',
        allowed_branches: ['CSE', 'ISE'],
      },
      {
        company_id: companyMap['Microsoft Corporation'],
        role: 'Cloud Solutions Architect',
        season: '2026-2027',
        min_cgpa: 7.5,
        max_backlogs: 1, // Rahul passes here!
        drive_date: '2026-11-20',
        is_open: true,
        package_lpa: 24.0,
        description: 'Designing mission-critical Azure architectures and hybrid enterprise solutions.',
        allowed_branches: ['CSE', 'ECE', 'ISE'],
      },
      {
        company_id: companyMap['Amazon Development Centre'],
        role: 'Software Development Engineer - I',
        season: '2026-2027',
        min_cgpa: 7.0,
        max_backlogs: 2,
        drive_date: '2026-11-25',
        is_open: true,
        package_lpa: 28.0,
        description: 'Full-stack engineering for high-throughput microservices on AWS.',
        allowed_branches: [], // Open to all branches!
      },
      {
        company_id: companyMap['Cisco Systems'],
        role: 'Network Software Engineer',
        season: '2026-2027',
        min_cgpa: 7.0,
        max_backlogs: 0,
        drive_date: '2026-12-02',
        is_open: true,
        package_lpa: 18.0,
        description: 'Protocols, routers, software defined networking, and security appliances.',
        allowed_branches: ['ECE', 'CSE'],
      },
    ];

    const jobMap: Record<string, number> = {};
    for (const j of jobsData) {
      const res = await tx.query(
        `INSERT INTO job_listings (company_id, role, season, min_cgpa, max_backlogs, drive_date, is_open, package_lpa, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          j.company_id,
          j.role,
          j.season,
          j.min_cgpa,
          j.max_backlogs,
          j.drive_date,
          j.is_open,
          j.package_lpa,
          j.description,
        ]
      );
      const jobId = res.rows[0].id;
      jobMap[j.role] = jobId;

      // Seed allowed branches
      for (const branch of j.allowed_branches) {
        await tx.query(
          `INSERT INTO job_allowed_branches (job_id, branch) VALUES ($1, $2)`,
          [jobId, branch]
        );
      }
    }

    // 5. Seed Applications, Status Logs, Interview Slots, and Offers
    console.log('Seeding Applications & Workflows...');

    // Application 1: Sneha accepted offer at Google
    const app1 = await tx.query(
      `INSERT INTO applications (student_id, job_id, status, applied_at, updated_at)
       VALUES ($1, $2, 'ACCEPTED', '2026-09-01 10:00:00Z', '2026-09-15 16:30:00Z') RETURNING id`,
      [studentMap['1RV22CS088'], jobMap['Software Engineer - Distributed Systems']]
    );
    const app1Id = app1.rows[0].id;

    // Interview rounds for Sneha
    await tx.query(
      `INSERT INTO interview_slots (application_id, round_no, scheduled_at, venue, passed, notes)
       VALUES ($1, 1, '2026-09-05 10:00:00Z', 'Google Hall A / Meet', true, 'Exceptional algorithms knowledge')`,
      [app1Id]
    );
    await tx.query(
      `INSERT INTO interview_slots (application_id, round_no, scheduled_at, venue, passed, notes)
       VALUES ($1, 2, '2026-09-10 14:00:00Z', 'Google Hall B / Meet', true, 'Strong system design')`,
      [app1Id]
    );

    // Offer for Sneha
    await tx.query(
      `INSERT INTO offers (application_id, package_lpa, offer_letter_key, accepted, issued_at)
       VALUES ($1, 32.5, $2, true, '2026-09-12 11:00:00Z')`,
      [app1Id, sampleOffer1Key]
    );

    // Status logs for Sneha
    await tx.query(
      `INSERT INTO application_status_log (application_id, from_status, to_status, changed_by, changed_at)
       VALUES ($1, NULL, 'APPLIED', $2, '2026-09-01 10:00:00Z')`,
      [app1Id, userMap['sneha']]
    );
    await tx.query(
      `INSERT INTO application_status_log (application_id, from_status, to_status, changed_by, changed_at)
       VALUES ($1, 'APPLIED', 'SHORTLISTED', $2, '2026-09-02 11:00:00Z')`,
      [app1Id, userMap['google_hr']]
    );
    await tx.query(
      `INSERT INTO application_status_log (application_id, from_status, to_status, changed_by, changed_at)
       VALUES ($1, 'SHORTLISTED', 'INTERVIEW_SCHEDULED', $2, '2026-09-04 09:00:00Z')`,
      [app1Id, userMap['google_hr']]
    );
    await tx.query(
      `INSERT INTO application_status_log (application_id, from_status, to_status, changed_by, changed_at)
       VALUES ($1, 'INTERVIEW_SCHEDULED', 'OFFERED', $2, '2026-09-12 11:00:00Z')`,
      [app1Id, userMap['google_hr']]
    );
    await tx.query(
      `INSERT INTO application_status_log (application_id, from_status, to_status, changed_by, changed_at)
       VALUES ($1, 'OFFERED', 'ACCEPTED', $2, '2026-09-15 16:30:00Z')`,
      [app1Id, userMap['sneha']]
    );

    // Application 2: Priya offered at Microsoft
    const app2 = await tx.query(
      `INSERT INTO applications (student_id, job_id, status, applied_at, updated_at)
       VALUES ($1, $2, 'OFFERED', '2026-10-01 11:00:00Z', '2026-10-20 15:00:00Z') RETURNING id`,
      [studentMap['1RV22IS045'], jobMap['Cloud Solutions Architect']]
    );
    const app2Id = app2.rows[0].id;

    await tx.query(
      `INSERT INTO interview_slots (application_id, round_no, scheduled_at, venue, passed, notes)
       VALUES ($1, 1, '2026-10-10 10:30:00Z', 'Microsoft Building 3', true, 'Clear grasp of distributed messaging')`,
      [app2Id]
    );

    await tx.query(
      `INSERT INTO offers (application_id, package_lpa, offer_letter_key, accepted, issued_at)
       VALUES ($1, 24.0, $2, false, '2026-10-20 15:00:00Z')`,
      [app2Id, sampleOffer2Key]
    );

    // Status logs for Priya
    await tx.query(
      `INSERT INTO application_status_log (application_id, from_status, to_status, changed_by, changed_at)
       VALUES ($1, NULL, 'APPLIED', $2, '2026-10-01 11:00:00Z')`,
      [app2Id, userMap['priya']]
    );
    await tx.query(
      `INSERT INTO application_status_log (application_id, from_status, to_status, changed_by, changed_at)
       VALUES ($1, 'APPLIED', 'OFFERED', $2, '2026-10-20 15:00:00Z')`,
      [app2Id, userMap['microsoft_hr']]
    );

    // Application 3: Rahul applied for Microsoft Cloud Solutions Architect
    const app3 = await tx.query(
      `INSERT INTO applications (student_id, job_id, status, applied_at, updated_at)
       VALUES ($1, $2, 'SHORTLISTED', '2026-10-05 09:30:00Z', '2026-10-08 14:00:00Z') RETURNING id`,
      [studentMap['1RV22CS001'], jobMap['Cloud Solutions Architect']]
    );
    const app3Id = app3.rows[0].id;

    // Interview scheduled for Rahul
    await tx.query(
      `INSERT INTO interview_slots (application_id, round_no, scheduled_at, venue, passed, notes)
       VALUES ($1, 1, '2026-11-20 11:00:00Z', 'Microsoft Campus Block B', NULL, 'Technical round 1')`,
      [app3Id]
    );

    await tx.query(
      `INSERT INTO application_status_log (application_id, from_status, to_status, changed_by, changed_at)
       VALUES ($1, NULL, 'APPLIED', $2, '2026-10-05 09:30:00Z')`,
      [app3Id, userMap['rahul']]
    );
    await tx.query(
      `INSERT INTO application_status_log (application_id, from_status, to_status, changed_by, changed_at)
       VALUES ($1, 'APPLIED', 'SHORTLISTED', $2, '2026-10-08 14:00:00Z')`,
      [app3Id, userMap['microsoft_hr']]
    );

    // Seed initial eligibility decisions
    await tx.query(
      `INSERT INTO eligibility_decisions (student_id, job_id, eligible, reason)
       VALUES ($1, $2, true, 'All eligibility conditions are met')`,
      [studentMap['1RV22CS001'], jobMap['Cloud Solutions Architect']]
    );

    await tx.query(
      `INSERT INTO eligibility_decisions (student_id, job_id, eligible, reason)
       VALUES ($1, $2, false, '1 active backlogs, maximum 0')`,
      [studentMap['1RV22CS001'], jobMap['Software Engineer - Distributed Systems']]
    );
  });

  console.log('✓ Database seeded successfully with realistic data!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => closeDb())
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

