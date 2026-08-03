import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { 
  LayoutDashboard, 
  BookOpen, 
  Compass, 
  UserCircle,
  MessageSquare,
  Award
} from 'lucide-react';
import API from '../../api/authApi';
import Header from '../common/Header';
import Footer from '../common/Footer';
import StudentSidebar from '../student/StudentSidebar';

const SOCKET_URL = API.defaults.baseURL 
  ? API.defaults.baseURL.replace('/api/v1', '') 
  : 'http://localhost:5000';

const StudentLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();

  // 1. Manage Responsive Sidebar Layout
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Fetch unread message counts across all active conversations
  const fetchUnreadCounts = useCallback(async () => {
    if (!currentUserId) return;

    try {
      // Fetch user's conversation threads safely via GET
      const res = await API.get('/chat/admin/conversations', { 
        _skipGlobalLoading: true 
      });

      const rawConversations = res.data?.data || res.data?.conversations || res.data || [];
      const conversationsList = Array.isArray(rawConversations) ? rawConversations : [];

      // Calculate total unread count across all rooms
      let totalUnreadSum = 0;

      conversationsList.forEach((room) => {
        if (!room.unreadCounts || !Array.isArray(room.unreadCounts)) return;

        const myUnreadRecord = room.unreadCounts.find((u) => {
          const uId = typeof u.user === 'object' ? (u.user?._id || u.user?.id) : u.user;
          return uId?.toString() === currentUserId;
        });

        if (myUnreadRecord) {
          totalUnreadSum += myUnreadRecord.count || 0;
        }
      });

      setUnreadCount(totalUnreadSum);
    } catch (err) {
      console.error("Failed to load layout notification counts:", err);
      setUnreadCount(0);
    }
  }, [currentUserId]);

  // 3. Initialize Socket Connection & Setup Live Listeners
  useEffect(() => {
    if (!currentUserId) return;

    const activeSocket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket']
    });

    setSocket(activeSocket);
    fetchUnreadCounts();

    const handleConversationUpdate = (updatedRoom) => {
      if (!updatedRoom || !updatedRoom.participants) return;

      const isMyConversation = updatedRoom.participants.some((p) => {
        const pId = typeof p === 'object' ? (p._id || p.id) : p;
        return pId?.toString() === currentUserId;
      });

      if (isMyConversation) {
        fetchUnreadCounts();
      }
    };

    activeSocket.on('conversation_updated', handleConversationUpdate);

    return () => {
      activeSocket.off('conversation_updated', handleConversationUpdate);
      activeSocket.disconnect();
    };
  }, [currentUserId, fetchUnreadCounts]);

  // 4. Inject Dynamic Unread Badge Count into Navigation Links
  const studentLinks = useMemo(() => {
    return [
      { title: 'Learning Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { title: 'My Enrolled Courses', path: '/student/my-courses', icon: BookOpen },
      { title: 'Browse Catalog', path: '/student/catalog', icon: Compass },
      { title: 'My Certificates', path: '/student/mycertificates', icon: Award },
      { 
        title: 'Community Chat', 
        path: '/student/messages', 
        icon: MessageSquare,
        unreadCount: unreadCount 
      },
      { title: 'My Profile Settings', path: '/student/profile', icon: UserCircle }
    ];
  }, [unreadCount]);

  return (
   <div className="h-screen w-full flex flex-col bg-white m-0 p-0 overflow-hidden">
      {/* Fixed Sticky Header */}
      <Header 
        onToggleMobileSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isMobileSidebarOpen={isSidebarOpen}
        setIsMobileSidebarOpen={setIsSidebarOpen}
      />

      {/* Layout Body Workspace */}
      <div className="flex flex-1 relative w-full items-start m-0 p-0 overflow-hidden h-[calc(100vh-4rem)]">
        <StudentSidebar 
          links={studentLinks} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
        />

        {/* Scrollable Main View Container */}
       <main className="flex-1 min-w-0 h-full bg-white overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 custom-admin-scrollbar flex flex-col justify-between">
          <div className="max-w-7xl w-full mx-auto mb-12">
            <Outlet context={{ socket, fetchUnreadCounts, totalDirectUnread: unreadCount }} />
          </div>

          {/* Footer attached inside scrollable viewport */}
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;