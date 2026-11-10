import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

export interface OfferPdfOptions {
  companyName: string;
  studentName: string;
  usn?: string;
  branch?: string;
  role: string;
  packageLpa: number | string;
  dateStr?: string;
  storageKey?: string;
}

export function generateOfferPdfBuffer(opts: OfferPdfOptions): Buffer {
  const company = opts.companyName || 'Hiring Partner';
  const student = opts.studentName || 'Candidate';
  const role = opts.role || 'Software Engineer';
  const packageStr = Number(opts.packageLpa).toFixed(2);
  const date = opts.dateStr || new Date().toLocaleDateString('en-GB');
  const ref = opts.storageKey || 'OFFER-2026-DOC';
  const usnInfo = opts.usn ? ` (USN: ${opts.usn}${opts.branch ? ' | Branch: ' + opts.branch : ''})` : '';

  const lines = [
    'RV COLLEGE OF ENGINEERING - CAMPUS PLACEMENT DIVISION',
    'DEPARTMENT OF TRAINING AND PLACEMENT - PLACEMENT PORTAL TALENTHUB',
    '------------------------------------------------------------------------------------------------------------------------------------',
    'CONFIDENTIAL LETTER OF APPOINTMENT & PLACEMENT OFFER',
    `Date of Issuance: ${date}`,
    `Document Reference: ${ref}`,
    '',
    `Dear ${student}${usnInfo},`,
    '',
    `We are delighted to formally offer you employment with ${company}.`,
    `Following your exemplary evaluation across all technical and behavioural interview rounds,`,
    `we are pleased to confirm your appointment for the following position:`,
    '',
    `    Designation:             ${role}`,
    `    Compensation (CTC):      Rs. ${packageStr} LPA (Lakhs Per Annum)`,
    `    Placement Season:        Academic Year 2026-2027`,
    `    Work Location:           Bengaluru Campus / Flexible Hybrid`,
    '',
    'TERMS AND CONDITIONS OF EMPLOYMENT:',
    '1. In accordance with the University Placement Policy (Lab 4 / 3NF Policy Engine), acceptance',
    '   of this offer constitutes a binding single-offer allocation (1 Student = 1 Dream Offer).',
    '2. This appointment is contingent on achieving a minimum aggregate CGPA and zero active backlogs',
    '   at the time of official graduation.',
    '3. Verification of all educational certificates, background checks, and conduct will be conducted',
    '   prior to the official onboarding date.',
    '',
    `We welcome you to the ${company} family and wish you an outstanding professional journey!`,
    '',
    'Authorized Signatures & Institutional Endorsement:',
    `Director of Career Guidance & Placement           Head of University Relations`,
    `RV College of Engineering, Bengaluru             ${company}`
  ];

  let streamContent = 'BT\n/F1 13 Tf\n50 740 Td\n(' + lines[0].replace(/[\(\)\\\\]/g, '\\\\$&') + ') Tj\nET\n';
  streamContent += 'BT\n/F1 9 Tf\n50 725 Td\n(' + lines[1].replace(/[\(\)\\\\]/g, '\\\\$&') + ') Tj\nET\n';
  streamContent += 'BT\n/F1 10 Tf\n50 710 Td\n(' + lines[2].replace(/[\(\)\\\\]/g, '\\\\$&') + ') Tj\nET\n';
  streamContent += 'BT\n/F2 12 Tf\n50 685 Td\n(' + lines[3].replace(/[\(\)\\\\]/g, '\\\\$&') + ') Tj\nET\n';

  streamContent += 'BT\n/F1 9 Tf\n50 655 Td\n15 TL\n';
  for (let i = 4; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith('    Designation:') || l.startsWith('    Compensation') || l.startsWith('TERMS AND CONDITIONS')) {
      streamContent += 'ET\nBT\n/F2 9.5 Tf\n(' + l.replace(/[\(\)\\\\]/g, '\\\\$&') + ') \'\n/F1 9 Tf\n';
    } else {
      streamContent += '(' + l.replace(/[\(\)\\\\]/g, '\\\\$&') + ') \'\n';
    }
  }
  streamContent += 'ET\n';

  const streamBuf = Buffer.from(streamContent, 'utf-8');

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n');
  objects.push('4 0 obj\n<< /Length ' + streamBuf.length + ' >>\nstream\n' + streamContent + 'endstream\nendobj\n');
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');

  let pdf = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets: number[] = [0];
  let curOffset = Buffer.byteLength(pdf, 'latin1');

  for (let i = 0; i < objects.length; i++) {
    offsets.push(curOffset);
    pdf += objects[i];
    curOffset = Buffer.byteLength(pdf, 'latin1');
  }

  const xrefOffset = curOffset;
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n';
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\n';
  pdf += 'startxref\n' + xrefOffset + '\n%%EOF\n';
  return Buffer.from(pdf, 'latin1');
}

export class StorageService {
  constructor() {
    if (!fs.existsSync(config.storagePath)) {
      fs.mkdirSync(config.storagePath, { recursive: true });
    }
  }

  /**
   * Generates a cryptographically unpredictable storage key for an offer letter (FR-8.3, NFR-3.5).
   * Format: offer_<uuid>.<ext>
   */
  generateKey(originalFilename: string = 'offer.pdf'): string {
    const ext = path.extname(originalFilename) || '.pdf';
    return `offer_${uuidv4()}${ext}`;
  }

  getFilePath(storageKey: string): string {
    // Sanitize key to prevent path traversal
    const safeKey = path.basename(storageKey);
    return path.join(config.storagePath, safeKey);
  }

  fileExists(storageKey: string): boolean {
    const filePath = this.getFilePath(storageKey);
    return fs.existsSync(filePath);
  }

  saveBuffer(storageKey: string, buffer: Buffer): void {
    const filePath = this.getFilePath(storageKey);
    fs.writeFileSync(filePath, buffer);
  }

  /**
   * Generates a standard compliant valid PDF offer letter document if none is uploaded.
   */
  generateMockOfferLetter(
    companyName: string,
    studentName: string,
    role: string,
    packageLpa: number,
    usn?: string,
    branch?: string
  ): string {
    const key = this.generateKey('offer_letter.pdf');
    const pdfBuf = generateOfferPdfBuffer({
      companyName,
      studentName,
      usn,
      branch,
      role,
      packageLpa,
      storageKey: key,
    });
    this.saveBuffer(key, pdfBuf);
    return key;
  }

  /**
   * Guarantees that the file on disk is an authentic, valid PDF file.
   * Auto-repairs legacy raw mock text strings.
   */
  ensureValidOfferPdf(storageKey: string, opts: OfferPdfOptions): void {
    const filePath = this.getFilePath(storageKey);
    let needRegenerate = false;
    if (!fs.existsSync(filePath)) {
      needRegenerate = true;
    } else {
      const stats = fs.statSync(filePath);
      if (stats.size < 500) {
        needRegenerate = true;
      } else {
        const head = fs.readFileSync(filePath, { encoding: 'latin1', flag: 'r' }).slice(0, 100);
        if (head.includes('Mock Offer Letter:') || head.includes('=====')) {
          needRegenerate = true;
        }
      }
    }

    if (needRegenerate) {
      const pdfBuf = generateOfferPdfBuffer({ ...opts, storageKey });
      this.saveBuffer(storageKey, pdfBuf);
    }
  }
}

export const storageService = new StorageService();
