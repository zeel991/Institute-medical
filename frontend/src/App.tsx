import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register'; 

// Layout and Module Imports
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import FacilityManagement from './components/facilities/FacilityManagement';
import ComplaintList from './components/complaints/ComplaintList';
import ComplaintCreate from './components/complaints/ComplaintCreate';
import EntryExitLogs from './components/entryExit/EntryExitLogs';
import Placeholder from './components/common/Placeholder'; 
import UserManagement from './components/users/UserManagement';
import MedicalRecordView from './components/medical/MedicalRecordView';
import MedicineInventory from './components/inventory/MedicineInventory';
import Scheduling from './components/scheduling/Scheduling'; // RESTORED IMPORT

// Import necessary icon library for the sidebar
import 'react-icons';


// --- Actual Module Components ---
import ComplaintDetail from './components/complaints/ComplaintDetail'; 


// --- Protected Route Wrapper ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium text-gray-700">
        Loading application data...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// --- Main App Content ---
const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes (Wrapped in Layout) */}
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/facilities" element={<ProtectedRoute><FacilityManagement /></ProtectedRoute>} />
        
        {/* Inventory Route */}
        <Route path="/inventory" element={<ProtectedRoute><MedicineInventory /></ProtectedRoute>} />
        
        {/* Scheduling Route */}
        <Route path="/scheduling" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />


        {/* Complaints Routes */}
        <Route path="/complaints" element={<ProtectedRoute><ComplaintList /></ProtectedRoute>} />
        <Route path="/complaints/new" element={<ProtectedRoute><ComplaintCreate /></ProtectedRoute>} />
        <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
        
        <Route path="/logs" element={<ProtectedRoute><EntryExitLogs /></ProtectedRoute>} />
        
        {/* Management Routes */}
        <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/medical/:userId/record" element={<ProtectedRoute><MedicalRecordView /></ProtectedRoute>} /> 
        
        {/* Catch-all route */}
        <Route path="*" element={<ProtectedRoute><Placeholder title="404 Not Found" /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
