import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export interface DashboardStats {
  totalComplaints: number;
  openComplaints: number;
  closedComplaints: number;
  avgResolutionTime: number;
  complaintsByStatus: {
    status: string;
    count: number;
  }[];
  complaintsByPriority: {
    priority: string;
    count: number;
  }[];
}
