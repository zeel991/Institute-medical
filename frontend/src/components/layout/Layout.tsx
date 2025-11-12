import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { MdMenu } from 'react-icons/md';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex flex-col flex-1">
        {/* Pass toggle function and state to Header */}
        <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        
        {/* Main content area shifts based on sidebar visibility */}
        <main className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? '' : 'ml-0'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
