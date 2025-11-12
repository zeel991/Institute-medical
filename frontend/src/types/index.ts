export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  description?: string;
  location?: string;
  isActive: boolean;
}

export interface Assignment {
  id: string;
  assignedTo: User;
  assignedAt: string;
  notes?: string;
  isActive: boolean;
}

export interface StatusHistory {
  id: string;
  fromStatus?: string;
  toStatus: string;
  notes?: string;
  changedAt: string;
}

export interface EntryExitLog {
  id: string;
  user: User;
  type: string;
  timestamp: string;
  location?: string;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  userId: string;
  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  emergencyContact: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalLog {
  id: string;
  staff: { name: string; role: string };
  timestamp: string;
  diagnosis: string;
  treatment: string;
  medication: string | null;
}

export interface Appointment {
  id: string;
  student: { id: string; name: string; email: string };
  staff: { id: string; name: string; email: true } | null;
  scheduledTime: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  description?: string;
  stockLevel: number;
  unit: string;
  expiryDate?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetailedComplaint {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  attachment?: string;
  facility: Facility;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  assignments: Assignment[];
  statusHistory: ComplaintStatusHistory[];
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  attachment?: string;
  facility: Facility;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalComplaints: number;
  openComplaints: number;
  closedComplaints: number;
  avgResolutionTime: number; // in hours
  complaintsByStatus: {
    status: string;
    count: number;
  }[];
  complaintsByPriority: {
    priority: string;
    count: number;
  }[];
}
