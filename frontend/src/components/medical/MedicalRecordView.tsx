import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { MedicalRecord, MedicalLog, User } from '../../types';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdOutlineHealing, MdEdit, MdSave, MdHistory, MdAdd, MdArrowBack } from 'react-icons/md';
import Modal from '../common/Modal'; 
// Note: PatientReports component is kept out to avoid dependencies for now.

// Helper to capitalize first letter
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// --- Component for creating a new Medical Log ---
const LogCreation: React.FC<{ userId: string, onLogCreated: () => void, targetUser: User }> = ({ userId, onLogCreated, targetUser }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [medication, setMedication] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/medical/${userId}/logs`, { diagnosis, treatment, medication });
      alert('Medical log created successfully.');
      setDiagnosis('');
      setTreatment('');
      setMedication('');
      onLogCreated();
    } catch (err: any) {
      alert(`Failed to create log: ${err.response?.data?.error || 'Server error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-green-50 p-6 rounded-xl border border-green-200 space-y-4">
      <h4 className="text-lg font-semibold text-green-700 flex items-center">
        <MdAdd className="w-5 h-5 mr-1" /> Add New Treatment Log for {targetUser.name}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Diagnosis (e.g., Common Cold, Sprained Ankle)"
          required
          className="w-full border p-2 rounded text-sm"
        />
        <textarea
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          placeholder="Treatment details"
          required
          rows={2}
          className="w-full border p-2 rounded text-sm"
        />
        <input
          type="text"
          value={medication}
          onChange={(e) => setMedication(e.target.value)}
          placeholder="Medication Prescribed (Optional)"
          className="w-full border p-2 rounded text-sm"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Save Medical Log'}
        </button>
      </form>
    </div>
  );
};


// --- Main Medical Record View Component ---
const MedicalRecordView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [logs, setLogs] = useState<MedicalLog[]>([]);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<MedicalRecord>>({});
  const [logRefreshKey, setLogRefreshKey] = useState(0);

  const canEdit = user?.role === 'admin' || user?.role === 'medical_staff';
  const canView = canEdit;

  const fetchMedicalData = async () => {
    if (!userId || !canView) return;
    setIsLoading(true);
    try {
      // 1. Fetch Basic User Info
      const userResponse = await api.get<User[]>('/users?all=true');
      const foundUser = userResponse.data.find(u => u.id === userId);
      if (!foundUser) throw new Error('User not found.');
      setTargetUser(foundUser);
      
      // 2. Fetch or Create Record
      const recordResponse = await api.get<MedicalRecord>(`/medical/${userId}/record`);
      setRecord(recordResponse.data);
      setEditData(recordResponse.data);
      
      // 3. Fetch Logs
      const logsResponse = await api.get<MedicalLog[]>(`/medical/${userId}/logs`);
      setLogs(logsResponse.data);
      
    } catch (err: any) {
      console.error('Failed to fetch medical data:', err.response || err);
      if (err.response?.status === 403 || err.response?.status === 401) {
          alert('Access Denied. Only Medical Staff and Admin can view medical records.');
          navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalData();
  }, [userId, logRefreshKey]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !canEdit) return;

    try {
      await api.put(`/medical/${userId}/record`, editData);
      setRecord(prev => ({ ...prev!, ...editData }));
      setIsEditing(false);
      alert('Medical record updated.');
    } catch (err: any) {
      alert(`Update failed: ${err.response?.data?.error || 'Server error'}`);
    }
  };


  if (isLoading || !targetUser) {
    return <div className="text-center py-10">Loading medical data...</div>;
  }
  
  if (!canView) {
      return <div className="p-4 bg-red-100 text-red-700 rounded-lg">Access Denied: You must be Admin or Medical Staff to view this page.</div>;
  }


  return (
    <div className="space-y-8">
      <button 
        onClick={() => navigate('/users')}
        className="flex items-center text-indigo-600 hover:text-indigo-800 transition mb-6"
      >
        <MdArrowBack className="w-5 h-5 mr-1" /> Back to User Management
      </button>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <MdOutlineHealing className="w-8 h-8 mr-2 text-red-600" />
            Medical Record: {targetUser.name} ({capitalize(targetUser.role)})
          </h2>
          {canEdit && (
            <button
              onClick={() => setIsEditing(prev => !prev)}
              className={`px-4 py-2 text-white rounded-lg transition ${isEditing ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              <MdEdit className="inline mr-1" /> {isEditing ? 'Cancel Edit' : 'Edit Details'}
            </button>
          )}
        </div>

        {/* Permanent Record Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-gray-700">
            <div className="md:col-span-2">
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Basic Health Information</h3>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <DetailRow label="Blood Type" value={record?.bloodType || 'N/A'} name="bloodType" isEditing={isEditing} data={editData} onChange={handleEditChange} />
                    <DetailRow label="Allergies" value={record?.allergies || 'None recorded'} name="allergies" isEditing={isEditing} data={editData} onChange={handleEditChange} isTextArea />
                    <DetailRow label="Chronic Conditions" value={record?.chronicConditions || 'None'} name="chronicConditions" isEditing={isEditing} data={editData} onChange={handleEditChange} isTextArea />
                    <DetailRow label="Emergency Contact" value={record?.emergencyContact || 'N/A'} name="emergencyContact" isEditing={isEditing} data={editData} onChange={handleEditChange} />
                    
                    {isEditing && (
                        <div className="pt-4 flex justify-end">
                            <button type="submit" className="flex items-center space-x-1 px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                                <MdSave className="w-4 h-4" />
                                <span>Save Health Details</span>
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
      </div>
      
      {/* Treatment Log Creation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canEdit && targetUser.role !== 'admin' && (
            <LogCreation userId={userId} onLogCreated={() => setLogRefreshKey(prev => prev + 1)} targetUser={targetUser} />
        )}
      </div>

      {/* Medical Log History */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center">
            <MdHistory className="w-6 h-6 mr-2"/> Treatment History
        </h3>
        <div className="space-y-4">
            {logs.length > 0 ? logs.map(log => (
                <div key={log.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold text-gray-800">Diagnosis: {log.diagnosis}</p>
                        <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600">Treatment: {log.treatment}</p>
                    {log.medication && <p className="text-sm text-gray-600">Medication: <span className="font-medium text-red-600">{log.medication}</span></p>}
                    <p className="text-xs mt-2 text-right text-gray-500">Logged by: {log.staff.name} ({log.staff.role.replace(/_/g, ' ')})</p>
                </div>
            )) : (
                <p className="text-gray-500">No medical treatment history recorded.</p>
            )}
        </div>
      </div>
    </div>
  );
};

// --- Helper Components for UI ---

interface DetailRowProps {
    label: string;
    value: string | null;
    name: keyof MedicalRecord;
    isEditing: boolean;
    data: Partial<MedicalRecord>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    isTextArea?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, name, isEditing, data, onChange, isTextArea }) => (
    <div className="flex items-start py-2 border-b last:border-b-0">
        <span className="w-48 text-sm font-medium text-gray-500">{label}:</span>
        <div className="flex-1">
            {isEditing ? (
                isTextArea ? (
                    <textarea
                        name={name as string}
                        value={(data[name] as string) || ''}
                        onChange={onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
                        rows={2}
                        className="w-full border p-1 rounded text-sm resize-none"
                    />
                ) : (
                    <input
                        type="text"
                        name={name as string}
                        value={(data[name] as string) || ''}
                        onChange={onChange}
                        className="w-full border p-1 rounded text-sm"
                    />
                )
            ) : (
                <span className="font-medium text-gray-900">{value}</span>
            )}
        </div>
    </div>
);


export default MedicalRecordView;
