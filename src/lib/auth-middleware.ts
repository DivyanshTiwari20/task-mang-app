// lib/auth-middleware.ts

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface AuthenticatedUser {
  id: number;
  username: string;
  role: 'admin' | 'leader' | 'employee';
  department_id: number | null;
}

/**
 * Simple JWT-based authentication for API routes
 * You can also use session-based auth or other methods
 */
export function authenticateRequest(req: NextRequest): AuthenticatedUser | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      department_id: decoded.department_id,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      department_id: user.department_id,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '15d' }
  );
}