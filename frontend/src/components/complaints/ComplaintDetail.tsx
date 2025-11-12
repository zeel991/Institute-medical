import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { DetailedComplaint, User } from '../../types';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MdArrowBack, MdAssignment, MdCheck, MdTimeline, MdPriorityHigh, MdDownload 
} from 'react-icons/md';

// Helper for status badge styling (omitted for brevity)
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'new': return 'bg-blue-100 text-blue-800';
        case 'assigned': return 'bg-yellow-100 text-yellow-800';
        case 'in_progress': return 'bg-indigo-100 text-indigo-800';
        case 'resolved': return 'bg-green-100 text-green-800';
        case 'closed': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-200 text-gray-700';
    }
};

const ComplaintDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [complaint, setComplaint] = useState<DetailedComplaint | null>(null);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth checks
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'facility_manager' || isAdmin;
  const isStaff = user?.role === 'medical_staff' || isManager;
  
  // State for Assignment Form (omitted for brevity)
  const [assignmentId, setAssignmentId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // State for Status Update Form (omitted for brevity)
  const [nextStatus, setNextStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  
  const validTransitions: Record<string, string[]> = {
      new: ['assigned'],
      assigned: ['in_progress'],
      in_progress: ['resolved'],
      resolved: ['closed'],
      closed: [],
  };

  // --- Data Fetching (omitted for brevity) ---
  const fetchComplaintAndStaff = async () => {
    try {
      const complaintResponse = await api.get<DetailedComplaint>(`/complaints/${id}`);
      setComplaint(complaintResponse.data);
      
      if (isManager) {
        const staffResponse = await api.get<User[]>('/users'); 
        setStaffUsers(staffResponse.data);
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch complaint or staff:', err);
      if (err.response?.status === 403 && !complaint) {
          setError('Could not load complaint details. Check permissions.');
      } else {
          setError(err.response?.data?.error || 'Failed to load complaint details.');
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id && user) {
        fetchComplaintAndStaff();
    }
  }, [id, user]);

  useEffect(() => {
    if (complaint) {
        const currentStatus = complaint.status.toLowerCase();
        if (validTransitions[currentStatus] && validTransitions[currentStatus].length > 0) {
            setNextStatus(validTransitions[currentStatus][0]);
        } else {
            setNextStatus('');
        }
    }
  }, [complaint]);
  
  // --- Action Handlers (omitted for brevity) ---
  const handleAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager || !assignmentId) return;
    
    try {
      await api.post(`/complaints/${id}/assign`, {
        assignedToId: assignmentId,
        notes: assignmentNotes,
      });
      alert('Complaint assigned successfully!');
      fetchComplaintAndStaff(); // Refresh data
    } catch (err: any) {
      alert(`Assignment failed: ${err.response?.data?.error || 'Error assigning complaint.'}`);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStaff || !nextStatus || !complaint) return;
    
    try {
      await api.patch(`/complaints/${id}/status`, {
        status: nextStatus,
        notes: statusNotes,
      });
      alert(`Status updated to ${nextStatus.replace(/_/g, ' ')}.`);
      fetchComplaintAndStaff(); // Refresh data
    } catch (err: any) {
      alert(`Status update failed: ${err.response?.data?.error || 'Error updating status.'}`);
    }
  };


  // --- Render Logic (omitted for brevity) ---
  if (isLoading) {
    return <div className="text-center py-10">Loading complaint details...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error: {error}</div>;
  }
  
  if (!complaint) {
      return <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg">Complaint not found.</div>;
  }
  
  const currentAssignment = complaint.assignments.find(a => a.isActive);
  const currentStatusKey = complaint.status.toLowerCase();

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/complaints')}
        className="flex items-center text-indigo-600 hover:text-indigo-800 transition mb-6"
      >
        <MdArrowBack className="w-5 h-5 mr-1" /> Back to Complaints List
      </button>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{complaint.title}</h2>
          <span className={`px-4 py-1 text-sm font-semibold rounded-full capitalize ${getStatusBadge(complaint.status)}`}>
            {complaint.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Complaint Details Grid (omitted for brevity) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-gray-700">
          <DetailItem label="Facility" value={complaint.facility.name} />
          <DetailItem label="Priority" value={complaint.priority} icon={MdPriorityHigh} />
          <DetailItem label="Created By" value={complaint.createdBy.name} />
          <DetailItem label="Created At" value={new Date(complaint.createdAt).toLocaleString()} />
          <DetailItem 
            label="Current Assignment" 
            value={currentAssignment ? currentAssignment.assignedTo.name : 'Unassigned'} 
            icon={MdAssignment}
          />
          {complaint.attachment && (
            <DetailItem 
              label="Attachment" 
              value={
                <a 
                  // FIX: Simplified URL construction to reliably hit http://localhost:3000/uploads/...
                  href={`${api.defaults.baseURL?.replace('/api', '')}${complaint.attachment}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center text-indigo-600 hover:text-indigo-800"
                >
                  View Attachment <MdDownload className="w-5 h-5 ml-1" />
                </a>
              } 
            />
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-xl font-semibold mb-2">Description</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{complaint.description}</p>
        </div>
      </div>
      
      {/* Staff/Manager Actions (omitted for brevity) */}
      {(isManager || isStaff) && complaint.status !== 'closed' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. Assignment Form (omitted for brevity) */}
              {isManager && (
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
                      <h3 className="text-xl font-semibold text-indigo-700 flex items-center"><MdAssignment className='mr-2'/> Re/Assign Complaint</h3>
                      <form onSubmit={handleAssignment} className="space-y-3">
                          <div>
                              <label htmlFor="assignmentId" className="block text-sm font-medium text-gray-700">Assign To</label>
                              <select
                                name="assignmentId"
                                value={assignmentId}
                                onChange={(e) => setAssignmentId(e.target.value)}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                              >
                                <option value="">Select Staff Member</option>
                                {staffUsers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.role.replace(/_/g, ' ')})</option>
                                ))}
                              </select>
                          </div>
                          <div>
                              <label htmlFor="assignmentNotes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                              <input
                                type="text"
                                value={assignmentNotes}
                                onChange={(e) => setAssignmentNotes(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                              />
                          </div>
                          <button 
                            type="submit" 
                            className="w-full py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                            disabled={!assignmentId}
                          >
                            Assign
                          </button>
                      </form>
                  </div>
              )}
              
              {/* 2. Status Update Form (omitted for brevity) */}
              {isStaff && (
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
                      <h3 className="text-xl font-semibold text-green-700 flex items-center"><MdCheck className='mr-2'/> Update Status</h3>
                      <form onSubmit={handleStatusUpdate} className="space-y-3">
                          <div>
                              <label htmlFor="nextStatus" className="block text-sm font-medium text-gray-700">Next Status</label>
                              <select
                                name="nextStatus"
                                value={nextStatus}
                                onChange={(e) => setNextStatus(e.target.value)}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                                disabled={validTransitions[currentStatusKey]?.length === 0}
                              >
                                {validTransitions[currentStatusKey]?.map(status => (
                                    <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                                ))}
                              </select>
                              {validTransitions[currentStatusKey]?.length === 0 && (
                                  <p className="mt-1 text-sm text-red-500">No further status transitions allowed.</p>
                              )}
                          </div>
                          <div>
                              <label htmlFor="statusNotes" className="block text-sm font-medium text-gray-700">Resolution Notes (Required for Resolved/Closed)</label>
                              <textarea
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                                rows={2}
                                required={nextStatus === 'resolved' || nextStatus === 'closed'}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                              />
                          </div>
                          <button 
                            type="submit" 
                            className="w-full py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                            disabled={validTransitions[currentStatusKey]?.length === 0 || nextStatus === ''}
                          >
                            Update Status
                          </button>
                      </form>
                  </div>
              )}
          </div>
      )}
      
      {/* Status History Timeline (omitted for brevity) */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4"><MdTimeline className='mr-2'/> Status History</h3>
        <ol className="relative border-l border-gray-200 ml-4">                  
          {complaint.statusHistory.slice().reverse().map((history, index) => (
            <li key={history.id} className="mb-6 ml-6">            
              <span className="absolute flex items-center justify-center w-3 h-3 bg-indigo-200 rounded-full -left-1.5 ring-8 ring-white">
              </span>
              <h4 className="flex items-center mb-1 text-lg font-semibold text-gray-900 capitalize">
                {history.toStatus.replace(/_/g, ' ')}
              </h4>
              <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
                {new Date(history.changedAt).toLocaleString()}
              </time>
              {history.notes && (
                  <p className="mb-4 text-base font-normal text-gray-500">
                      Notes: {history.notes}
                  </p>
              )}
            </li>
          ))}
        </ol>
      </div>
      
    </div>
  );
};

// --- Small helper component for consistent detail display (omitted for brevity) ---
interface DetailItemProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ElementType;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon: Icon }) => (
    <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-500 flex items-center">
            {Icon && <Icon className='w-4 h-4 mr-1' />}
            {label}
        </span>
        <span className="text-base font-semibold text-gray-800">{value}</span>
    </div>
);

export default ComplaintDetail;
