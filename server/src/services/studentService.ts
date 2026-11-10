import { studentRepository } from '../repositories/studentRepository.js';
import { Student } from '../types/index.js';
import { realtime } from '../realtime/index.js';

export class StudentService {
  async getProfile(studentId: number): Promise<Student> {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new Error('Student profile not found');
    }
    return student;
  }

  async updateConsent(studentId: number, consentGiven: boolean): Promise<Student> {
    const updated = await studentRepository.updateConsent(studentId, consentGiven);
    if (!updated) {
      throw new Error('Student not found');
    }
    realtime.broadcast('STUDENT_CONSENT_UPDATED', { studentId, consentGiven });
    return updated;
  }

  async anonymizeProfile(studentId: number): Promise<Student> {
    const anonymized = await studentRepository.anonymize(studentId);
    if (!anonymized) {
      throw new Error('Student not found');
    }
    realtime.broadcast('STUDENT_ANONYMIZED', { studentId });
    return anonymized;
  }
}

export const studentService = new StudentService();

