import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Complaint } from '../../types';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdOpenInNew } from 'react-icons/md';

// --- Utility function for styling status badges ---
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

const ComplaintList: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        // The backend endpoint filters complaints based on the user's role/ID
        const response = await api.get<Complaint[]>('/complaints');
        setComplaints(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch complaints.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  if (isLoading) {
    return <div className="text-center py-10">Loading complaints list...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Your Complaints</h2>
        <button
          onClick={() => navigate('/complaints/new')}
          className="flex items-center space-x-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
        >
          <MdAdd className="w-5 h-5" />
          <span>Create Complaint</span>
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {complaints.length > 0 ? (
              complaints.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">{c.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.facility.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{c.priority}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadge(c.status)}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => navigate(`/complaints/${c.id}`)} className="text-indigo-600 hover:text-indigo-900">
                      <MdOpenInNew className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No complaints found for your account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplaintList;
