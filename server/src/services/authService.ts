import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { userRepository } from '../repositories/userRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { companyRepository } from '../repositories/companyRepository.js';
import { AuthResponse, JWTPayload, UserRole, Branch } from '../types/index.js';

export class AuthService {
  async login(username: string, password: string): Promise<AuthResponse> {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid username or password');
    }

    let profile = null;
    if (user.role === 'student' && user.student_id) {
      profile = await studentRepository.findById(user.student_id);
    } else if (user.role === 'company' && user.company_id) {
      profile = await companyRepository.findById(user.company_id);
    }

    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      studentId: user.student_id,
      companyId: user.company_id,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        studentId: user.student_id,
        companyId: user.company_id,
        profile,
      },
    };
  }

  async registerStudent(data: {
    username: string;
    password: string;
    usn: string;
    full_name: string;
    email: string;
    branch: Branch;
    cgpa: number;
    active_backlogs?: number;
    cleared_backlogs?: number;
    consent_given?: boolean;
  }): Promise<AuthResponse> {
    // Check existing
    const existingUser = await userRepository.findByUsername(data.username);
    if (existingUser) {
      throw new Error(`Username '${data.username}' is already taken.`);
    }

    const existingStudentUsn = await studentRepository.findByUsn(data.usn);
    if (existingStudentUsn) {
      throw new Error(`Student with USN '${data.usn}' already exists.`);
    }

    const existingStudentEmail = await studentRepository.findByEmail(data.email);
    if (existingStudentEmail) {
      throw new Error(`Student with email '${data.email}' already exists.`);
    }

    // Create student record
    const student = await studentRepository.create({
      usn: data.usn,
      full_name: data.full_name,
      email: data.email,
      branch: data.branch,
      cgpa: data.cgpa,
      active_backlogs: data.active_backlogs ?? 0,
      cleared_backlogs: data.cleared_backlogs ?? 0,
      consent_given: data.consent_given ?? false,
    });

    // Create user credentials
    const passwordHash = bcrypt.hashSync(data.password, 10);
    const user = await userRepository.create({
      username: data.username,
      password_hash: passwordHash,
      role: 'student',
      student_id: student.id,
      company_id: null,
    });

    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      studentId: user.student_id,
      companyId: user.company_id,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        studentId: user.student_id,
        companyId: user.company_id,
        profile: student,
      },
    };
  }

  async registerCompany(data: {
    username: string;
    password: string;
    company_name: string;
    description?: string;
    website?: string;
  }): Promise<AuthResponse> {
    const existingUser = await userRepository.findByUsername(data.username);
    if (existingUser) {
      throw new Error(`Username '${data.username}' is already taken.`);
    }

    let company = await companyRepository.findByName(data.company_name);
    if (!company) {
      company = await companyRepository.create({
        company_name: data.company_name,
        description: data.description,
        website: data.website,
      });
    }

    const passwordHash = bcrypt.hashSync(data.password, 10);
    const user = await userRepository.create({
      username: data.username,
      password_hash: passwordHash,
      role: 'company',
      student_id: null,
      company_id: company.id,
    });

    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      studentId: null,
      companyId: company.id,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        studentId: null,
        companyId: company.id,
        profile: company,
      },
    };
  }
}

export const authService = new AuthService();

