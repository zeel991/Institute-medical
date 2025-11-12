import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { EntryExitLog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MdInput, MdOutput, MdHistory, MdInfo } from 'react-icons/md';

// --- Log Creation Form (Stable Version) ---
const LogCreationForm: React.FC<{ onLogCreated: () => void }> = ({ onLogCreated }) => {
  const { user } = useAuth();
  const [logType, setLogType] = useState<'Entry' | 'Exit'>('Entry');
  const [location, setLocation] = useState('Main Gate');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.post('/entry-exit', {
        type: logType,
        location,
        notes,
      });
      setMessage(`Log created successfully: ${logType} at ${new Date().toLocaleTimeString()}`);
      setLocation('Main Gate');
      setNotes('');
      onLogCreated();
    } catch (err: any) {
      setMessage('Failed to create log.');
      console.error('Log creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h3 className="text-xl font-semibold text-indigo-700 mb-4">
        Activity Logger ({user.name})
      </h3>
      
      {message && (
        <div className={`p-2 mb-4 rounded text-sm ${message.startsWith('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      <div className="border-t pt-4">
          <h4 className="text-lg font-medium text-gray-700 mb-3">General Log Entry</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="logType"
                  value="Entry"
                  checked={logType === 'Entry'}
                  onChange={() => setLogType('Entry')}
                  className="form-radio text-indigo-600"
                />
                <MdInput className="w-5 h-5 text-indigo-600" />
                <span>Entry</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="logType"
                  value="Exit"
                  checked={logType === 'Exit'}
                  onChange={() => setLogType('Exit')}
                  className="form-radio text-indigo-600"
                />
                <MdOutput className="w-5 h-5 text-indigo-600" />
                <span>Exit</span>
              </label>
            </div>
            
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g., Main Gate, Dorm B)"
              required
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
            />
            
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (Optional)"
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
            >
              Log Activity
            </button>
          </form>
      </div>
    </div>
  );
};


// --- Log List Component (Stable Version) ---
const EntryExitLogs: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'facility_manager';

  const [logs, setLogs] = useState<EntryExitLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const logsResponse = await api.get<EntryExitLog[]>('/entry-exit');
      setLogs(logsResponse.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch logs/status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [refreshKey]);

  if (isLoading) {
    return <div className="text-center py-10">Loading activity logs...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Entry/Exit Logs</h2>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error: {error}</div>
      )}

      {/* Log Creation Form (Accessible by everyone) */}
      <LogCreationForm 
        onLogCreated={() => setRefreshKey(prev => prev + 1)} 
      />

      {/* Log History Table (Only visible to Admin/Manager) */}
      {isAdminOrManager ? (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex items-center space-x-2">
            <MdHistory className="w-6 h-6 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-800">Full Activity History</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user.name} ({log.user.role})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          log.type === 'Entry' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                          {log.type}
                      </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.location || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.notes || 'N/A'}</td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                          No entry/exit logs found in the system.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 bg-blue-100 text-blue-700 rounded-lg">
          <div className='flex items-center space-x-2'>
            <MdInfo className='w-5 h-5'/>
            <p className="text-sm font-medium">Log history viewing is restricted to Facility Managers and Admins.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryExitLogs;
