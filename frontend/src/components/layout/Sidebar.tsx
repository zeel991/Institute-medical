import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard,
  MdOutlineHealing,
  MdOutlineReport,
  MdPeople,
  MdExitToApp,
  MdSupervisorAccount
} from 'react-icons/md';

const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: MdDashboard,
    roles: ['admin', 'facility_manager', 'medical_staff', 'resident'],
  },
  {
    path: '/complaints',
    label: 'Complaints',
    icon: MdOutlineReport,
    roles: ['admin', 'facility_manager', 'medical_staff', 'resident'],
  },
  {
    path: '/facilities',
    label: 'Facilities Mgmt',
    icon: MdOutlineHealing,
    roles: ['admin', 'facility_manager', 'resident'],
  },
  {
    path: '/logs',
    label: 'Entry/Exit Logs',
    icon: MdExitToApp,
    roles: ['admin', 'facility_manager'],
  },
  {
    path: '/users',
    label: 'User Mgmt',
    icon: MdSupervisorAccount,
    roles: ['admin'],
  },
];

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const userRole = user.role;

  return (
    <div className="flex flex-col w-64 h-full bg-indigo-800 text-white shadow-lg">
      <div className="p-4 text-2xl font-bold border-b border-indigo-700">
        Hostel Care
      </div>
      <nav className="flex-grow p-4 space-y-2">
        {navItems
          .filter(item => item.roles.includes(userRole))
          .map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-150 ${
                location.pathname === item.path
                  ? 'bg-indigo-700 font-semibold shadow-md'
                  : 'hover:bg-indigo-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
      </nav>
      <div className="p-4 text-xs text-indigo-300 border-t border-indigo-700">
        © 2025 Medical Facilities App
      </div>
    </div>
  );
};

export default Sidebar;
