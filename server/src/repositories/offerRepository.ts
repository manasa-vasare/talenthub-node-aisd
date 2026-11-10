import { query, DbClient } from '../db/connection.js';
import { Offer } from '../types/index.js';

export class OfferRepository {
  async findById(id: number, client?: DbClient): Promise<Offer | null> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<Offer>(
      `SELECT o.*,
              s.full_name as student_name, s.usn, s.branch, s.id as student_id,
              j.role,
              c.company_name
       FROM offers o
       JOIN applications a ON o.application_id = a.id
       JOIN students s ON a.student_id = s.id
       JOIN job_listings j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE o.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByApplicationId(applicationId: number, client?: DbClient): Promise<Offer | null> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<Offer>(
      `SELECT o.*,
              s.full_name as student_name, s.usn, s.branch, s.id as student_id,
              j.role,
              c.company_name
       FROM offers o
       JOIN applications a ON o.application_id = a.id
       JOIN students s ON a.student_id = s.id
       JOIN job_listings j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE o.application_id = $1`,
      [applicationId]
    );
    return res.rows[0] || null;
  }

  async findByOfferLetterKey(key: string, client?: DbClient): Promise<Offer | null> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<Offer>(
      `SELECT o.*,
              s.full_name as student_name, s.usn, s.branch, s.id as student_id,
              j.role,
              c.company_name
       FROM offers o
       JOIN applications a ON o.application_id = a.id
       JOIN students s ON a.student_id = s.id
       JOIN job_listings j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE o.offer_letter_key = $1`,
      [key]
    );
    return res.rows[0] || null;
  }

  async findAll(): Promise<Offer[]> {
    const res = await query<Offer>(
      `SELECT o.*,
              s.full_name as student_name, s.usn, s.branch, s.id as student_id,
              j.role, j.season,
              c.company_name, c.id as company_id
       FROM offers o
       JOIN applications a ON o.application_id = a.id
       JOIN students s ON a.student_id = s.id
       JOIN job_listings j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       ORDER BY o.issued_at DESC`
    );
    return res.rows;
  }

  async create(
    data: {
      application_id: number;
      package_lpa: number;
      offer_letter_key: string;
    },
    client?: DbClient
  ): Promise<Offer> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<Offer>(
      `INSERT INTO offers (application_id, package_lpa, offer_letter_key, accepted, issued_at)
       VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP)
       RETURNING *`,
      [data.application_id, data.package_lpa, data.offer_letter_key]
    );
    return res.rows[0];
  }

  async markAccepted(offerId: number, client?: DbClient): Promise<Offer | null> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<Offer>(
      `UPDATE offers
       SET accepted = true
       WHERE id = $1
       RETURNING *`,
      [offerId]
    );
    return res.rows[0] || null;
  }
}

export const offerRepository = new OfferRepository();

