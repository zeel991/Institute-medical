import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Facility } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { MdAdd, MdEdit, MdDelete, MdCheckCircle, MdCancel, MdInfoOutline, MdWarning } from 'react-icons/md';

// --- Interface for Form State ---
interface FacilityFormData {
  id?: string;
  name: string;
  type: 'medical' | 'general';
  description: string;
  location: string;
  isActive: boolean;
}

// --- Main Facility Management Component ---
const FacilityManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'facility_manager' || isAdmin;
  const isViewer = !!user; // All authenticated users should be able to view

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FacilityFormData>({
    name: '',
    type: 'general',
    description: '',
    location: '',
    isActive: true,
  });

  // --- Fetch Facilities ---
  const fetchFacilities = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Facility[]>('/facilities');
      setFacilities(response.data);
      setError(null);
    } catch (err: any) {
      // Log the error for diagnostics in the console
      console.error('API Error fetching facilities:', err.response || err);
      // Display a general error message if the API call truly fails
      setError('Could not load facilities. Check console for details.'); 
      setFacilities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isViewer) {
      fetchFacilities();
    }
  }, [isViewer]);

  // --- Modal and Form Handlers (Omitted for brevity, unchanged) ---
  const handleOpenCreate = () => {
    if (!isManager) return;
    setIsEditing(false);
    setFormData({ name: '', type: 'general', description: '', location: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (facility: Facility) => {
    if (!isManager) return;
    setIsEditing(true);
    setFormData({ ...facility, type: facility.type as 'medical' | 'general' });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;

    try {
      if (isEditing && formData.id) {
        await api.put(`/facilities/${formData.id}`, formData);
      } else {
        await api.post('/facilities', formData);
      }
      setIsModalOpen(false);
      fetchFacilities(); // Refresh list
    } catch (err: any) {
      alert(`Operation failed: ${err.response?.data?.error || 'An unexpected error occurred.'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin || !window.confirm('Are you sure you want to delete this facility? This cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/facilities/${id}`);
      fetchFacilities(); // Refresh list
    } catch (err: any) {
      alert(`Deletion failed: ${err.response?.data?.error || 'An unexpected error occurred.'}`);
    }
  };

  // --- Component Rendering ---
  if (isLoading) {
    return <div className="text-center py-10">Loading facilities...</div>;
  }
  
  // If the user is authenticated but the backend returns a 403 or 500, we show a critical error
  // but still render the main structure.
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Facilities Catalog</h2>
        {isManager && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            <MdAdd className="w-5 h-5" />
            <span>Add Facility</span>
          </button>
        )}
      </div>
      
      {/* Critical Error Display */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center space-x-2">
            <MdWarning className="w-5 h-5" />
            <p className="text-sm font-medium">Critical Error: {error} (Check your backend server logs or browser console.)</p>
        </div>
      )}

      {/* Message for non-managers */}
      {!isManager && (
        <div className="p-4 bg-blue-100 text-blue-700 rounded-lg flex items-center space-x-2">
            <MdInfoOutline className="w-5 h-5" />
            <p className="text-sm font-medium">Viewing facility list. You do not have permissions to manage or modify facilities.</p>
        </div>
      )}


      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              {isManager && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {facilities.length > 0 ? facilities.map((facility) => (
              <tr key={facility.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{facility.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        facility.type === 'medical' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                        {facility.type}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{facility.location || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {facility.isActive ? (
                        <MdCheckCircle className="text-green-500 w-5 h-5" title="Active" />
                    ) : (
                        <MdCancel className="text-red-500 w-5 h-5" title="Inactive" />
                    )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{facility.description || 'No description'}</td>
                {isManager && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                    <button onClick={() => handleOpenEdit(facility)} className="text-indigo-600 hover:text-indigo-900">
                      <MdEdit className="w-5 h-5" title="Edit" />
                    </button>
                    {isAdmin && (
                        <button onClick={() => handleDelete(facility.id)} className="text-red-600 hover:text-red-900">
                          <MdDelete className="w-5 h-5" title="Delete" />
                        </button>
                    )}
                  </td>
                )}
              </tr>
            )) : (
                <tr>
                    <td colSpan={isManager ? 6 : 5} className="text-center py-8 text-gray-500">
                        {error ? 'Facilities could not be loaded due to the error above.' : 'No facilities found in the system.'}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Facility Create/Edit Modal (Only shown if isManager) */}
      {isManager && (
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={isEditing ? 'Edit Facility' : 'Create New Facility'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form fields here... (same as before) */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  name="type"
                  id="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                >
                  <option value="general">General</option>
                  <option value="medical">Medical</option>
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Is Active</label>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {isEditing ? 'Save Changes' : 'Create Facility'}
                </button>
              </div>
            </form>
          </Modal>
      )}
    </div>
  );
};

export default FacilityManagement;
