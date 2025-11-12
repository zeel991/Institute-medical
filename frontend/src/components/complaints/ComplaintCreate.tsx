import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Facility } from '../../types';
import { useNavigate } from 'react-router-dom';
import { MdSend, MdAttachFile } from 'react-icons/md';

interface FormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  facilityId: string;
  attachment: File | null;
}

const ComplaintCreate: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 'medium',
    facilityId: '',
    attachment: null,
  });
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch facilities list for the dropdown
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await api.get<Facility[]>('/facilities');
        setFacilities(response.data.filter(f => f.isActive));
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, facilityId: response.data[0].id }));
        }
      } catch (err: any) {
        setErrorMessage('Failed to load facilities. Cannot create complaint.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setFormData(prev => ({ ...prev, attachment: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus('loading');
    setErrorMessage(null);

    if (!formData.facilityId) {
      setErrorMessage('Please select a facility.');
      setSubmissionStatus('error');
      return;
    }

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('priority', formData.priority);
      data.append('facilityId', formData.facilityId);
      if (formData.attachment) {
        data.append('attachment', formData.attachment);
      }

      // Note: Use a specific header for file uploads
      await api.post('/complaints', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmissionStatus('success');
      setTimeout(() => navigate('/complaints'), 1500); // Redirect to list
    } catch (err: any) {
      console.error('Complaint submission failed:', err.response || err);
      setErrorMessage(err.response?.data?.error || 'Complaint submission failed. Check attachment size/type.');
      setSubmissionStatus('error');
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading form data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-3xl font-bold text-indigo-700">Create New Complaint</h2>
        <button 
          onClick={() => navigate('/complaints')}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Back to List
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg">{errorMessage}</div>
      )}

      {submissionStatus === 'success' && (
        <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-lg">Complaint submitted successfully!</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="e.g., Broken AC Unit"
            />
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              name="priority"
              id="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        
        {/* Facility */}
        <div>
          <label htmlFor="facilityId" className="block text-sm font-medium text-gray-700">Affected Facility</label>
          <select
            name="facilityId"
            id="facilityId"
            value={formData.facilityId}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
            disabled={facilities.length === 0}
          >
            {facilities.length === 0 ? (
                <option value="">No active facilities available</option>
            ) : (
                facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                ))
            )}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Detailed Description</label>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
            rows={4}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        {/* Attachment */}
        <div className="flex items-center space-x-3">
          <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 flex items-center space-x-1">
            <MdAttachFile className="w-5 h-5" />
            <span>Attachment (Max 5MB, Image/PDF):</span>
          </label>
          <input
            type="file"
            name="attachment"
            id="attachment"
            onChange={handleFileChange}
            className="text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submissionStatus === 'loading' || facilities.length === 0}
            className="flex items-center space-x-2 px-6 py-3 text-lg font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {submissionStatus === 'loading' ? 'Submitting...' : 'Submit Complaint'}
            <MdSend className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplaintCreate;
