import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Appointment, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MdAccessTimeFilled, MdCheckCircle, MdCancel, MdOutlineEdit, MdCalendarToday } from 'react-icons/md';
import Modal from '../common/Modal';

// Helper for status badge styling
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'confirmed': return 'bg-blue-100 text-blue-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

// --- Appointment Creation Form ---
const AppointmentCreation: React.FC<{ onAppointmentCreated: () => void }> = ({ onAppointmentCreated }) => {
  const [scheduledTime, setScheduledTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (new Date(scheduledTime) <= new Date()) {
        setMessage('Scheduled time must be in the future.');
        setLoading(false);
        return;
    }

    try {
      await api.post('/scheduling', { scheduledTime, reason });
      setMessage('Appointment requested successfully. Status: Pending.');
      setScheduledTime('');
      setReason('');
      onAppointmentCreated();
    } catch (err: any) {
      setMessage(`Failed to book appointment: ${err.response?.data?.error || 'Server error'}`);
      console.error('Appointment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 space-y-4">
      <h3 className="text-xl font-semibold text-indigo-700 flex items-center">
        <MdAccessTimeFilled className="w-6 h-6 mr-1" /> Request Medical Appointment
      </h3>
      
      {message && (
        <div className={`p-2 mb-4 rounded text-sm ${message.startsWith('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          min={getMinDateTime()}
          required
          className="w-full border p-2 rounded text-sm"
        />
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for appointment (e.g., Routine checkup, Persistent cough)"
          required
          rows={2}
          className="w-full border p-2 rounded text-sm resize-none"
        />
        <button 
          type="submit" 
          disabled={loading || !scheduledTime || !reason}
          className="w-full py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
};


// --- Appointment Management Modal ---
const ManageAppointmentModal: React.FC<{
    appointment: Appointment | null;
    staffUsers: User[];
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}> = ({ appointment, staffUsers, isOpen, onClose, onUpdate }) => {
    const [status, setStatus] = useState<string>('');
    const [staffId, setStaffId] = useState<string>('');
    const { user } = useAuth();
    const canAssign = user?.role === 'admin';

    useEffect(() => {
        if (appointment) {
            setStatus(appointment.status);
            setStaffId(appointment.staff?.id || '');
        }
    }, [appointment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appointment) return;

        try {
            await api.put(`/scheduling/${appointment.id}`, {
                status: status,
                staffId: staffId || null,
            });
            alert('Appointment updated successfully.');
            onUpdate();
            onClose();
        } catch (err: any) {
            alert(`Update failed: ${err.response?.data?.error || 'Server error'}`);
        }
    };

    if (!appointment) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Appointment for ${appointment.student.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">Scheduled Time: <span className="font-semibold">{new Date(appointment.scheduledTime).toLocaleString()}</span></p>
                    <p className="text-sm">Reason: {appointment.reason}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} required className="mt-1 w-full border p-2 rounded text-sm bg-white">
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                
                {canAssign && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Assign Staff (Admin Only)</label>
                        <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="mt-1 w-full border p-2 rounded text-sm bg-white">
                            <option value="">Unassigned</option>
                            {staffUsers.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.role.replace(/_/g, ' ')})</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="pt-2 flex justify-end">
                    <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
};


// --- Main Scheduling Component ---
const Scheduling: React.FC = () => {
    const { user } = useAuth();
    const isMedicalStaffOrAdmin = user?.role === 'admin' || user?.role === 'medical_staff';

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [staffUsers, setStaffUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchAppointments = async () => {
        try {
            const apptResponse = await api.get<Appointment[]>('/scheduling');
            setAppointments(apptResponse.data);
            
            if (user?.role === 'admin') {
                const staffResponse = await api.get<User[]>('/users?roles=medical_staff,admin');
                setStaffUsers(staffResponse.data);
            } else if (user?.role === 'medical_staff') {
                setStaffUsers(appointments.length > 0 ? [user] : []);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch appointments.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [refreshKey, user]);
    
    const handleOpenManage = (appt: Appointment) => {
        if (!isMedicalStaffOrAdmin) return;
        setSelectedAppointment(appt);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return <div className="text-center py-10">Loading scheduling data...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Medical Appointment Booking</h2>
            
            {user && (user.role === 'resident' || user.role === 'facility_manager') && (
                <AppointmentCreation onAppointmentCreated={() => setRefreshKey(prev => prev + 1)} />
            )}

            {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error: {error}</div>}

            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex items-center space-x-2">
                    <MdCalendarToday className="w-6 h-6 text-gray-600"/>
                    <h3 className="text-xl font-semibold text-gray-800">
                        {isMedicalStaffOrAdmin ? 'Appointments for Review' : 'Your Appointments'}
                    </h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            {isMedicalStaffOrAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manage</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {appointments.length > 0 ? appointments.map((appt) => (
                            <tr key={appt.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {new Date(appt.scheduledTime).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appt.student.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{appt.reason}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {appt.staff?.name || 'Unassigned'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusBadge(appt.status)}`}>
                                      {appt.status}
                                    </span>
                                </td>
                                {isMedicalStaffOrAdmin && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleOpenManage(appt)} className="text-indigo-600 hover:text-indigo-900">
                                            <MdOutlineEdit className="w-5 h-5" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                    {isMedicalStaffOrAdmin ? 'No pending appointments for staff review.' : 'You have no scheduled appointments.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ManageAppointmentModal
                appointment={selectedAppointment}
                staffUsers={staffUsers}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={() => setRefreshKey(prev => prev + 1)}
            />
        </div>
    );
};

export default Scheduling;
