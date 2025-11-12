import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { DashboardStats } from '../../types';
import { MdOutlineReport, MdCheckCircle, MdCancel, MdTimer } from 'react-icons/md';

// --- Dashboard Card Component ---
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
    <div className={`p-3 rounded-full text-white ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

// --- Main Dashboard Component ---
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get<DashboardStats>('/dashboard/stats');
        setStats(response.data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard stats:', err);
        setError(err.response?.data?.error || 'Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-lg text-indigo-700">
        Loading Dashboard Data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-700 bg-red-100 border border-red-300 rounded-lg">
        Error loading dashboard: {error}
      </div>
    );
  }

  if (!stats) return null;

  // Function to sort statuses for display (e.g., New first)
  const sortStatuses = (a: any, b: any) => {
    const order = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];
    return order.indexOf(a.status) - order.indexOf(b.status);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800">System Overview</h2>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Complaints"
          value={stats.totalComplaints}
          icon={MdOutlineReport}
          color="bg-indigo-500"
        />
        <StatCard
          title="Open Complaints"
          value={stats.openComplaints}
          icon={MdCancel}
          color="bg-red-500"
        />
        <StatCard
          title="Closed Complaints"
          value={stats.closedComplaints}
          icon={MdCheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Avg. Resolution Time"
          value={`${stats.avgResolutionTime} hrs`}
          icon={MdTimer}
          color="bg-yellow-500"
        />
      </div>

      {/* Detailed Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaints by Status */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Complaints by Status</h3>
          <ul className="space-y-2">
            {stats.complaintsByStatus.sort(sortStatuses).map((item) => (
              <li key={item.status} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
                <span className="capitalize font-medium">{item.status.replace(/_/g, ' ')}</span>
                <span className="text-lg font-bold text-indigo-600">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Complaints by Priority */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Complaints by Priority</h3>
          <ul className="space-y-2">
            {stats.complaintsByPriority.map((item) => (
              <li key={item.priority} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
                <span className="capitalize font-medium">{item.priority}</span>
                <span className="text-lg font-bold text-indigo-600">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
