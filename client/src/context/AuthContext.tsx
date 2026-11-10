import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Branch } from '../types';
import { apiRequest, setToken, removeToken, getToken } from '../api/client';

export interface StudentRegisterInput {
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
}

export interface CompanyRegisterInput {
  username: string;
  password: string;
  company_name: string;
  description?: string;
  website?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  registerStudent: (data: StudentRegisterInput) => Promise<void>;
  registerCompany: (data: CompanyRegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest<{ user: User }>('/auth/me');
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username: string, password: string = 'student123') => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    setToken(res.token);
    setUser(res.user);
  };

  const registerStudent = async (data: StudentRegisterInput) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/register/student', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    setToken(res.token);
    setUser(res.user);
  };

  const registerCompany = async (data: CompanyRegisterInput) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/register/company', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerStudent, registerCompany, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
