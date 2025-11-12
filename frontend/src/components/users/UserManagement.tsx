import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { User } from '../../types';
import Modal from '../common/Modal';
import { MdEdit, MdPerson, MdSave, MdAdd, MdOutlineHealing } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

interface UserFormData {
  id: string;
  name: string;
  role: string;
}

interface NewUserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
}

const CREATABLE_ROLES = ['facility_manager', 'medical_staff', 'resident'];
const ALL_ROLES = ['admin', 'facility_manager', 'medical_staff', 'resident'];

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UserFormData>({
    id: '',
    name: '',
    role: '',
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFormData, setNewFormData] = useState<NewUserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'resident',
  });
  const [createError, setCreateError] = useState<string | null>(null);


  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<User[]>('/users?all=true');
      setUsers(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users. Admin permissions required.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshKey]);

  const handleOpenEdit = (user: User) => {
    setEditFormData({ id: user.id, name: user.name, role: user.role });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.put(`/users/${editFormData.id}`, editFormData);
      setIsEditModalOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert(`Update failed: ${err.response?.data?.error || 'An unexpected error occurred.'}`);
    }
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    try {
      await api.post('/auth/admin/register', newFormData);
      
      setIsCreateModalOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      const msg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'User creation failed.';
      setCreateError(msg);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading users...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">User & Role Management</h2>
        <button
          onClick={() => { setIsCreateModalOpen(true); setCreateError(null); }}
          className="flex items-center space-x-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
        >
          <MdAdd className="w-5 h-5" />
          <span>Create New User</span>
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'facility_manager' ? 'bg-yellow-100 text-yellow-800' :
                        user.role === 'medical_staff' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {user.role.replace(/_/g, ' ')}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                  <button onClick={() => handleOpenEdit(user)} className="text-indigo-600 hover:text-indigo-900">
                    <MdEdit className="w-5 h-5" />
                  </button>
                  {user.role !== 'admin' && (
                    <button 
                        onClick={() => navigate(`/medical/${user.id}/record`)}
                        className="text-red-600 hover:text-red-900"
                        title="View Medical Record"
                    >
                        <MdOutlineHealing className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals are omitted for brevity but remain below */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit User Details"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="flex items-center space-x-3">
            <MdPerson className="w-6 h-6 text-gray-500" />
            <span className="text-lg font-medium">{editFormData.name}</span>
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={editFormData.name}
              onChange={handleEditChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              id="role"
              value={editFormData.role}
              onChange={handleEditChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
            >
              {ALL_ROLES.map(role => (
                <option key={role} value={role} className='capitalize'>
                    {role.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <MdSave className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Create New User Account"
      >
        {/* Create Form Content is omitted for brevity */}
        {createError && (
            <div className="p-2 mb-3 text-red-700 bg-red-100 rounded-md text-sm">Error: {createError}</div>
        )}
        <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Account Type</label>
                <select
                name="role"
                id="role"
                value={newFormData.role}
                onChange={handleCreateChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                >
                {CREATABLE_ROLES.map(role => ( 
                    <option key={role} value={role} className='capitalize'>
                        {role.replace(/_/g, ' ')}
                    </option>
                ))}
                </select>
            </div>
            
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                type="text"
                name="name"
                id="name"
                value={newFormData.name}
                onChange={handleCreateChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>
            
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Used for Login)</label>
                <input
                type="email"
                name="email"
                id="email"
                value={newFormData.email}
                onChange={handleCreateChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password (Min 6 characters)</label>
                <input
                type="password"
                name="password"
                id="password"
                value={newFormData.password}
                onChange={handleCreateChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
          
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <MdAdd className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default UserManagement;
