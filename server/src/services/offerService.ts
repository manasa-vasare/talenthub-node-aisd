import { offerRepository } from '../repositories/offerRepository.js';
import { applicationRepository } from '../repositories/applicationRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { storageService } from './storageService.js';
import { withTransaction } from '../db/connection.js';
import { Offer, JWTPayload } from '../types/index.js';
import { realtime } from '../realtime/index.js';

export class OfferService {
  async issueOffer(
    data: {
      application_id: number;
      package_lpa: number;
      fileBuffer?: Buffer;
      fileName?: string;
    },
    actor: JWTPayload
  ): Promise<Offer> {
    const app = await applicationRepository.findById(data.application_id);
    if (!app) {
      throw new Error('Application not found');
    }

    if (actor.role === 'company' && app.company_id !== actor.companyId) {
      throw new Error('Unauthorized: You can only issue offers for your company’s listings.');
    }

    // Check 1:0..1 constraint (FR-8.6)
    const existingOffer = await offerRepository.findByApplicationId(data.application_id);
    if (existingOffer) {
      throw new Error('An offer has already been issued for this application.');
    }

    // Handle offer letter storage key
    let storageKey = '';
    if (data.fileBuffer && data.fileName) {
      storageKey = storageService.generateKey(data.fileName);
      storageService.saveBuffer(storageKey, data.fileBuffer);
    } else {
      // Generate clean standard offer document
      storageKey = storageService.generateMockOfferLetter(
        app.company_name || 'Hiring Company',
        app.student_name || 'Candidate',
        app.role || 'Job Role',
        data.package_lpa
      );
    }

    const offer = await withTransaction(async (tx) => {
      const createdOffer = await offerRepository.create(
        {
          application_id: data.application_id,
          package_lpa: data.package_lpa,
          offer_letter_key: storageKey,
        },
        tx
      );

      // Transition application to OFFERED
      await applicationRepository.updateStatus(data.application_id, 'OFFERED', tx);

      // Audit status change
      await auditRepository.logStatusChange(
        {
          application_id: data.application_id,
          from_status: app.status,
          to_status: 'OFFERED',
          changed_by: actor.userId,
        },
        tx
      );

      return createdOffer;
    });

    const fullOffer = await offerRepository.findById(offer.id);
    realtime.broadcast('OFFER_ISSUED', fullOffer);
    return fullOffer || offer;
  }

  /**
   * Accepts an offer in an ATOMIC transaction (FR-2.4, FR-8.4, NFR-8.4):
   * 1. offers.accepted = true
   * 2. applications.status = 'ACCEPTED'
   * 3. students.has_accepted_offer = true
   * 4. application_status_log row
   */
  async acceptOffer(applicationId: number, actor: JWTPayload): Promise<Offer> {
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new Error('Application not found');
    }

    if (actor.role === 'student' && app.student_id !== actor.studentId) {
      throw new Error('Unauthorized: You can only accept offers issued to you.');
    }

    const offer = await offerRepository.findByApplicationId(applicationId);
    if (!offer) {
      throw new Error('No offer found for this application.');
    }

    if (offer.accepted) {
      throw new Error('This offer has already been accepted.');
    }

    const student = await studentRepository.findById(app.student_id);
    if (!student) {
      throw new Error('Student profile not found');
    }

    if (student.has_accepted_offer) {
      throw new Error('You have already accepted another offer this season.');
    }

    await withTransaction(async (tx) => {
      // 1. Mark offer accepted
      await offerRepository.markAccepted(offer.id, tx);

      // 2. Transition application status to ACCEPTED
      await applicationRepository.updateStatus(applicationId, 'ACCEPTED', tx);

      // 3. Mark student.has_accepted_offer = true
      await studentRepository.updateHasAcceptedOffer(student.id, true, tx);

      // 4. Log status change
      await auditRepository.logStatusChange(
        {
          application_id: applicationId,
          from_status: 'OFFERED',
          to_status: 'ACCEPTED',
          changed_by: actor.userId,
        },
        tx
      );
    });

    const fullOffer = await offerRepository.findById(offer.id);
    realtime.broadcast('OFFER_ACCEPTED', { offer: fullOffer, studentId: student.id });
    return fullOffer || offer;
  }

  async getOfferLetterPath(storageKey: string, actor: JWTPayload): Promise<string> {
    const offer = await offerRepository.findByOfferLetterKey(storageKey);
    if (!offer) {
      throw new Error('Offer document not found.');
    }

    // Role-based access control (NFR-3.4, NFR-3.5)
    if (actor.role === 'student') {
      if (offer.student_id !== actor.studentId) {
        throw new Error('Unauthorized: You can only view your own offer letters.');
      }
    } else if (actor.role === 'company') {
      const app = await applicationRepository.findById(offer.application_id);
      if (app && app.company_id !== actor.companyId) {
        throw new Error('Unauthorized: You can only view offer letters issued by your company.');
      }
    }

    // Guarantee that the offer document on disk is an authentic, valid PDF
    storageService.ensureValidOfferPdf(storageKey, {
      companyName: offer.company_name || 'Hiring Partner',
      studentName: offer.student_name || 'Candidate',
      usn: (offer as any).usn || '1RV22CS000',
      branch: (offer as any).branch || 'Engineering',
      role: offer.role || 'Software Engineer',
      packageLpa: Number(offer.package_lpa),
      dateStr: offer.issued_at ? new Date(offer.issued_at).toLocaleDateString('en-GB') : undefined,
      storageKey,
    });

    const filePath = storageService.getFilePath(storageKey);
    return filePath;
  }
}

export const offerService = new OfferService();

