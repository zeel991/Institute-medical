import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Note: Notification logic is temporarily removed to diagnose loading crash.

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
      <h1 className="text-xl font-semibold text-indigo-700">
        Medical Facilities App
      </h1>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">
          Welcome, {user?.name} ({user?.role})
        </span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition duration-150"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
