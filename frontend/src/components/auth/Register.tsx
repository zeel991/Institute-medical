import React, { useState } from 'react';
import api from '../../api/client';
import Modal from '../common/Modal';

interface RegisterProps {
  isOpen: boolean;
  onClose: () => void;
}

const Register: React.FC<RegisterProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'resident',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, role: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Public registration endpoint
      await api.post('/auth/register', formData);
      setSuccess(true);
      setFormData({ name: '', email: '', password: '', role: 'resident' });
      // Close modal after success
      setTimeout(onClose, 2000); 
    } catch (err: any) {
      const msg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Resident/Staff Sign Up">
      {success && (
        <div className="p-3 mb-3 text-green-700 bg-green-100 rounded-lg text-sm">
          Registration successful! You can now log in.
        </div>
      )}
      {error && (
        <div className="p-3 mb-3 text-red-700 bg-red-100 rounded-lg text-sm">
          Error: {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Account Type</label>
          <select
            name="role"
            id="role"
            value={formData.role}
            onChange={handleRoleChange}
            required
            className="input-base mt-1 bg-white"
          >
            <option value="resident">Resident</option>
            <option value="medical_staff">Medical Staff</option>
          </select>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-base mt-1"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input-base"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="input-base"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full btn-primary py-2"
        >
          {loading ? 'Registering...' : success ? 'Success!' : 'Sign Up'}
        </button>
      </form>
    </Modal>
  );
};

export default Register;
