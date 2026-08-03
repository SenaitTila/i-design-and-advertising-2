// src/layouts/admin/AdminLayout.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { 
  LayoutDashboard, 
  FolderTree, 
  GraduationCap, 
  Video, 
  FileQuestion, 
  KeyRound, 
  UserCheck, 
  Users,
  Inbox
} from 'lucide-react';
import API from '../../api/authApi';
import Header from '../common/Header';
import Footer from '../common/Footer';
import AdminSidebar from '../admin/AdminSidebar';

const SOCKET_URL = API.defaults.baseURL 
  ? API.defaults.baseURL.replace('/api/v1', '') 
  : 'http://localhost:5000';

const AdminLayout = () => {
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(
    window.innerWidth >= 768
  );
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    const handleResize = () => {
      setIsAdminSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateTotalUnreads = useCallback((conversationsList) => {
    if (!currentUserId || !Array.isArray(conversationsList)) {
      setTotalUnreadCount(0);
      return;
    }

    const total = conversationsList.reduce((acc, chat) => {
      const myUnreadRecord = chat.unreadCounts?.find(u => {
        const uId = typeof u.user === 'object' ? (u.user?._id || u.user?.id) : u.user;
        return uId?.toString() === currentUserId.toString();
      });
      return acc + (myUnreadRecord ? myUnreadRecord.count : 0);
    }, 0);

    setTotalUnreadCount(total);
  }, [currentUserId]);

  const fetchUnreadCounts = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await API.get('/chat/admin/conversations', { _skipGlobalLoading: true });
      const chatData = res.data?.data || res.data?.conversations || res.data || [];
      const sanitizedData = Array.isArray(chatData) ? chatData : [];
      
      calculateTotalUnreads(sanitizedData);
    } catch (err) {
      console.error("Failed to load admin layout notification counts:", err);
      setTotalUnreadCount(0);
    }
  }, [currentUserId, calculateTotalUnreads]);

  useEffect(() => {
    if (!currentUserId) return;

    const activeSocket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket']
    });

    setSocket(activeSocket);
    fetchUnreadCounts();

    const handleConversationUpdate = () => {
      fetchUnreadCounts();
    };

    activeSocket.on('conversation_updated', handleConversationUpdate);

    return () => {
      activeSocket.off('conversation_updated', handleConversationUpdate);
      activeSocket.disconnect();
    };
  }, [currentUserId, fetchUnreadCounts]);

  const adminSections = useMemo(() => {
    return [
      { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, group: 'primary' },
      { title: 'Manage Categories', path: '/admin/categories', icon: FolderTree, group: 'primary' },
      { title: 'Manage Courses', path: '/admin/courses', icon: GraduationCap, group: 'primary' },
      { title: 'Manage Videos & Lessons', path: '/admin/videos', icon: Video, group: 'primary' },
      { title: 'Manage Quizzes', path: '/admin/quizzes', icon: FileQuestion, group: 'primary' },
      
      { title: 'Manage Access Key Tokens', path: '/admin/access-codes', icon: KeyRound, group: 'utility' },
      { title: 'Manage Student Access', path: '/admin/enrollments', icon: UserCheck, group: 'utility' },
      { title: 'Manage Users', path: '/admin/users', icon: Users, group: 'utility' },
      { 
        title: 'Inbox', 
        path: '/admin/inbox', 
        icon: Inbox,
        unreadCount: totalUnreadCount,
        group: 'utility'
      }
    ];
  }, [totalUnreadCount]);

  return (
    /* 🎯 THE ONLY GLOBAL SCROLLBAR EXISTS HERE ON THE OUTSIDE */
    <div className="min-h-screen w-full flex flex-col bg-white m-0 p-0 overflow-y-auto">
      <Header 
        onToggleMobileSidebar={() => setIsAdminSidebarOpen(!isAdminSidebarOpen)} 
        isMobileSidebarOpen={isAdminSidebarOpen}
        setIsMobileSidebarOpen={setIsAdminSidebarOpen}
      />
      
      {/* Structural horizontal container */}
      <div className="flex flex-1 relative w-full items-start m-0 p-0">
        <AdminSidebar 
          sections={adminSections} 
          isOpen={isAdminSidebarOpen} 
          setIsOpen={setIsAdminSidebarOpen} 
        />

        {/* 💻 MAIN CONTENT REGION: No heights, no overflow tracking. Content expands naturally down the screen. */}
        <main className="flex-1 min-w-0 bg-white p-4 sm:p-6 lg:p-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet context={{ socket, fetchUnreadCounts, sections: adminSections }} />
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminLayout;