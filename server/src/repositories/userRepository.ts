import { query } from '../db/connection.js';
import { User, UserRole } from '../types/index.js';

export class UserRepository {
  async findById(id: number): Promise<User | null> {
    const res = await query<User>(`SELECT * FROM users WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const res = await query<User>(`SELECT * FROM users WHERE username = $1`, [username]);
    return res.rows[0] || null;
  }

  async create(data: {
    username: string;
    password_hash: string;
    role: UserRole;
    student_id?: number | null;
    company_id?: number | null;
  }): Promise<User> {
    const res = await query<User>(
      `INSERT INTO users (username, password_hash, role, student_id, company_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.username, data.password_hash, data.role, data.student_id ?? null, data.company_id ?? null]
    );
    return res.rows[0];
  }
}

export const userRepository = new UserRepository();

