import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Medicine } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdOutlineHealing } from 'react-icons/md';

// --- Interface for Form State ---
interface MedicineFormData {
  id?: string;
  name: string;
  description: string;
  stockLevel: number | '';
  unit: string;
  expiryDate: string;
  location: string;
}

// --- Status Helper ---
const getStockStatus = (stock: number) => {
    if (stock > 10) return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    if (stock > 0) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
};

// --- Main Medicine Inventory Component ---
const MedicineInventory: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isMedicalStaff = user?.role === 'medical_staff' || isAdmin;
  const isManager = user?.role === 'facility_manager'; // Manager can view but not manage medical inventory

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<MedicineFormData>({
    name: '',
    description: '',
    stockLevel: 0,
    unit: 'Tablet',
    expiryDate: '',
    location: '',
  });

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // --- Fetch Medicines ---
  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Medicine[]>(`/medicine?search=${search}&availability=${filter}`);
      setMedicines(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
        fetchMedicines();
    }, 300); // Debounce search
    return () => clearTimeout(handler);
  }, [search, filter, refreshKey]);

  // --- Modal and Form Handlers ---
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({ name: '', description: '', stockLevel: 0, unit: 'Tablet', expiryDate: '', location: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (medicine: Medicine) => {
    setIsEditing(true);
    setFormData({ 
        ...medicine, 
        stockLevel: medicine.stockLevel,
        // Format date string for input type="date"
        expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().substring(0, 10) : ''
    });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'stockLevel' ? (value === '' ? '' : parseInt(value)) : value,
    }));
  };

  // --- CRUD Operations ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMedicalStaff) return;
    
    // Ensure stockLevel is not empty string when submitting
    const dataToSend = {
        ...formData,
        stockLevel: formData.stockLevel === '' ? 0 : formData.stockLevel,
    };

    try {
      if (isEditing && formData.id) {
        await api.put(`/medicine/${formData.id}`, dataToSend);
      } else {
        await api.post('/medicine', dataToSend);
      }
      setIsModalOpen(false);
      setRefreshKey(prev => prev + 1); // Refresh list
    } catch (err: any) {
      alert(`Operation failed: ${err.response?.data?.error || 'An unexpected error occurred.'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin || !window.confirm('Are you sure you want to delete this medicine entry?')) {
      return;
    }
    try {
      await api.delete(`/medicine/${id}`);
      setRefreshKey(prev => prev + 1); // Refresh list
    } catch (err: any) {
      alert(`Deletion failed: ${err.response?.data?.error || 'Failed to delete entry.'}`);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center">
        <MdOutlineHealing className="w-8 h-8 mr-2 text-red-600" />
        Medicine Inventory Management
      </h2>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error: {error}</div>}

      {/* Controls: Search, Filter, Add */}
      <div className="flex justify-between items-center bg-white p-4 shadow-sm rounded-xl border">
        <div className="flex space-x-4">
            <div className="relative">
                <MdSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="py-2 px-3 border rounded-lg bg-white"
            >
                <option value="">All Stock</option>
                <option value="in_stock">In Stock (&gt; 10)</option>
                <option value="low_stock">Low Stock (1-10)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
            </select>
        </div>
        
        {isMedicalStaff && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            <MdAdd className="w-5 h-5" />
            <span>Add New Medicine</span>
          </button>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              {(isMedicalStaff || isManager) && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medicines.map((med) => {
              const status = getStockStatus(med.stockLevel);
              return (
                <tr key={med.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{med.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                          {status.label} ({med.stockLevel})
                      </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{med.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{med.location || 'N/A'}</td>
                  {(isMedicalStaff || isManager) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                      {isMedicalStaff && (
                          <button onClick={() => handleOpenEdit(med)} className="text-indigo-600 hover:text-indigo-900">
                              <MdEdit className="w-5 h-5" />
                          </button>
                      )}
                      {isAdmin && (
                          <button onClick={() => handleDelete(med.id)} className="text-red-600 hover:text-red-900">
                            <MdDelete className="w-5 h-5" />
                          </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {medicines.length === 0 && (
            <div className='p-8 text-center text-gray-500'>No medicines found matching the criteria.</div>
        )}
      </div>

      {/* Medicine Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditing ? 'Edit Medicine Entry' : 'Add New Medicine'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name (e.g., Paracetamol 500mg)</label>
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
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="stockLevel" className="block text-sm font-medium text-gray-700">Stock Level</label>
                <input
                  type="number"
                  name="stockLevel"
                  id="stockLevel"
                  value={formData.stockLevel}
                  onChange={handleChange}
                  required
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit (e.g., Tablet, Bottle)</label>
                <input
                  type="text"
                  name="unit"
                  id="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
          </div>
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry Date (Optional)</label>
            <input
              type="date"
              name="expiryDate"
              id="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Storage Location</label>
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
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
              {isEditing ? 'Save Changes' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MedicineInventory;
