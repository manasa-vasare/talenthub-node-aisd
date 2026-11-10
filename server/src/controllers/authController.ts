import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { companyRepository } from '../repositories/companyRepository.js';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }
    const result = await authService.login(username, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}

export async function registerStudent(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.registerStudent(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function registerCompany(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.registerCompany(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    let profile = null;
    if (req.user.role === 'student' && req.user.studentId) {
      profile = await studentRepository.findById(req.user.studentId);
    } else if (req.user.role === 'company' && req.user.companyId) {
      profile = await companyRepository.findById(req.user.companyId);
    }

    res.json({
      user: {
        id: req.user.userId,
        username: req.user.username,
        role: req.user.role,
        studentId: req.user.studentId,
        companyId: req.user.companyId,
        profile,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

