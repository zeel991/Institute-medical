import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdNotifications, MdMenu } from 'react-icons/md'; // Imported MdMenu
import api from '../../api/client';
import Modal from '../common/Modal';

interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

const NotificationList: React.FC<{ notifications: Notification[], onMarkAsRead: (id: string) => void }> = ({ notifications, onMarkAsRead }) => (
    <div className="max-h-80 overflow-y-auto space-y-3">
        {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent notifications.</p>
        ) : (
            notifications.map(n => (
                <div 
                    key={n.id} 
                    className={`p-3 rounded-lg shadow-sm cursor-pointer transition ${
                        n.isRead ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                    }`}
                    onClick={() => onMarkAsRead(n.id)}
                >
                    <p className="font-semibold text-sm">{n.title}</p>
                    <p className="text-xs">{n.message}</p>
                    <time className="text-xs text-gray-500 block mt-1">{new Date(n.createdAt).toLocaleString()}</time>
                </div>
            ))
        )}
    </div>
);

interface HeaderProps {
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchNotifications = async () => {
    try {
      if (!user) return; 
      
      const countResponse = await api.get<{ unreadCount: number }>('/notifications/count');
      setUnreadCount(countResponse.data.unreadCount);
      
      if (isModalOpen) {
          const listResponse = await api.get<Notification[]>('/notifications');
          setNotifications(listResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); 
    return () => clearInterval(interval);
  }, [isModalOpen, refreshKey, user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleOpenModal = () => {
      setIsModalOpen(true);
      setRefreshKey(prev => prev + 1); 
  };
  
  const handleMarkAsRead = async (id: string) => {
      try {
          await api.patch(`/notifications/${id}/read`);
          setRefreshKey(prev => prev + 1); 
      } catch (error) {
          console.error('Failed to mark as read:', error);
      }
  };


  return (
    <>
        <header className="flex justify-between items-center px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
          
          <div className="flex items-center space-x-4">
             {/* Sidebar Toggle Button */}
            <button
                onClick={onToggleSidebar}
                className="p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
                <MdMenu className="w-6 h-6" />
            </button>
            
            <h1 className="text-2xl font-bold text-indigo-700">
                Hostel Health Portal
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            
            {/* Notification Icon */}
            <button 
                onClick={handleOpenModal}
                className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                title="Notifications"
            >
                <MdNotifications className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-600 rounded-full border-2 border-white transform translate-x-1/4 -translate-y-1/4">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            
            <span className="text-sm font-medium text-gray-700">
              {user?.name} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-150 shadow-sm"
            >
              Logout
            </button>
          </div>
        </header>
        
        {/* Notifications Modal */}
        <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title="Recent Notifications"
        >
            <NotificationList 
                notifications={notifications} 
                onMarkAsRead={handleMarkAsRead} 
            />
        </Modal>
    </>
  );
};

export default Header;
