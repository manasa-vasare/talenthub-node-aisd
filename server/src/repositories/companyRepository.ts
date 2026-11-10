import { query } from '../db/connection.js';
import { Company } from '../types/index.js';

export class CompanyRepository {
  async findById(id: number): Promise<Company | null> {
    const res = await query<Company>(`SELECT * FROM companies WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async findByName(name: string): Promise<Company | null> {
    const res = await query<Company>(`SELECT * FROM companies WHERE company_name = $1`, [name]);
    return res.rows[0] || null;
  }

  async findAll(): Promise<Company[]> {
    const res = await query<Company>(`SELECT * FROM companies ORDER BY company_name ASC`);
    return res.rows;
  }

  async create(data: { company_name: string; description?: string; website?: string }): Promise<Company> {
    const res = await query<Company>(
      `INSERT INTO companies (company_name, description, website)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.company_name, data.description || null, data.website || null]
    );
    return res.rows[0];
  }
}

export const companyRepository = new CompanyRepository();

