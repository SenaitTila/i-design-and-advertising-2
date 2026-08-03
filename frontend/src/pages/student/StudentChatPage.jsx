import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux'; 
import { useOutletContext } from 'react-router-dom';
import API from '../../api/authApi'; 
import ChatWindow from '../../components/chat/ChatWindow';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
  withCredentials: true
});

// Helper function to render human-readable last seen timestamps
const formatLastSeen = (dateString) => {
  if (!dateString) return 'Offline';
  const lastSeenDate = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return lastSeenDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const StudentChatPage = () => {
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' or 'group'
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);

  // User Search States (Restricted to Admin Role Only)
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeRecipient, setActiveRecipient] = useState(null);

  const { fetchUnreadCounts } = useOutletContext() || {};

  const currentUser = useSelector((state) => state.auth.user); 
  const currentUserId = currentUser?._id || currentUser?.id;

  // 🔌 0. Register Socket Presence & Listen for Real-Time Status Updates
  useEffect(() => {
    if (!currentUserId) return;

    // Notify backend that this user is online
    socket.emit('user_connected', currentUserId);

    // Listen for live online/offline updates from administrative users
    const handleStatusChange = ({ userId, isOnline, lastSeen }) => {
      setUsersList((prevList) =>
        prevList.map((u) =>
          u._id === userId ? { ...u, isOnline, lastSeen } : u
        )
      );

      // If active chat recipient changed status, update their active instance too
      setActiveRecipient((prev) =>
        prev?._id === userId ? { ...prev, isOnline, lastSeen } : prev
      );
    };

    socket.on('user_status_changed', handleStatusChange);

    return () => {
      socket.off('user_status_changed', handleStatusChange);
    };
  }, [currentUserId]);

  // 1. Fetch Directory — Strictly locked to role=admin
  useEffect(() => {
    if (activeTab !== 'direct') return;

    const fetchAdminDirectory = async () => {
      setSearching(true);
      try {
        const res = await API.get('/chat/search', {
          params: {
            q: searchQuery,
            role: 'admin' // Force query filter to return only admins
          },
          _skipGlobalLoading: true
        });

        const fetchedData = Array.isArray(res.data) 
          ? res.data 
          : res.data?.data || [];

        // Ensure strict client-side verification as backup
        const adminsOnly = fetchedData.filter(u => u.role?.toLowerCase() === 'admin');

        setUsersList(adminsOnly);
      } catch (err) {
        console.error("Failed to search admin directory:", err);
      } finally {
        setSearching(false);
      }
    };

    const delayTimer = setTimeout(() => {
      fetchAdminDirectory();
    }, 200);

    return () => clearTimeout(delayTimer);
  }, [searchQuery, activeTab]);

  // 2. Select an Admin to Chat With (Direct Messaging)
  const handleSelectUser = async (targetUser) => {
    // Defense check: prevent non-admin target selection
    if (targetUser.role?.toLowerCase() !== 'admin') {
      console.warn("Direct messaging is only permitted with administrators.");
      return;
    }

    setLoading(true);
    setActiveRecipient(targetUser);
    try {
      const res = await API.post('/chat/conversation', {
        targetUserId: targetUser._id
      }, { _skipGlobalLoading: true });
      
      const chatObject = res.data && res.data.success ? res.data.data : res.data;
      setConversation(chatObject);
    } catch (err) {
      console.error("Failed to initiate conversation with admin:", err);
    } finally {
      setLoading(false);
    }
  };

  // Derive unread count
  const studentUnread = conversation?.unreadCounts?.find(u => {
    const unreadUserId = typeof u.user === 'object' ? (u.user?._id || u.user?.id) : u.user;
    return unreadUserId?.toString() === currentUserId?.toString();
  });
  
  const unreadCount = studentUnread ? studentUnread.count : 0;

  // 3. Clear Notifications when active
  useEffect(() => {
    if (activeTab === 'direct' && conversation && currentUserId && unreadCount > 0) {
      const clearNotifications = async () => {
        try {
          const roomId = conversation._id || conversation.id;
          await API.put(`/chat/conversation/${roomId}/clear-unread`, {}, { _skipGlobalLoading: true });
          
          setConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              unreadCounts: prev.unreadCounts?.map(u => {
                const uId = typeof u.user === 'object' ? (u.user?._id || u.user?.id) : u.user;
                return uId?.toString() === currentUserId?.toString() ? { ...u, count: 0 } : u;
              })
            };
          });

          if (fetchUnreadCounts) fetchUnreadCounts();
        } catch (err) {
          console.error("Failed to flush read state badges:", err);
        }
      };

      clearNotifications();
    }
  }, [activeTab, conversation?._id, unreadCount, currentUserId, fetchUnreadCounts]);

  // 4. Socket updates
  useEffect(() => {
    if (!currentUserId) return;

    socket.on('conversation_updated', (updatedRoom) => {
      const isMyChat = updatedRoom.participants.some(
        p => {
          const pId = typeof p === 'object' ? (p._id || p.id) : p;
          return pId?.toString() === currentUserId?.toString();
        }
      );

      if (isMyChat) {
        setConversation(updatedRoom);
        if (activeTab === 'direct' && fetchUnreadCounts) {
          setTimeout(() => fetchUnreadCounts(), 100);
        }
      }
    });

    return () => {
      socket.off('conversation_updated');
    };
  }, [currentUserId, activeTab, fetchUnreadCounts]);

  const activeRoomId = conversation?._id || conversation?.id;

  return (
    <div className="max-w-6xl mx-auto space-y-6 w-full text-left">
      <div>
        <p className="text-sm text-gray-500 mt-1">
          Contact administrative support via direct messages or post in the public forum.
        </p>
      </div>

      {/* Tabs Menu Navigation Row */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('direct')}
          className={`pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 px-1 relative flex items-center gap-1.5
            ${activeTab === 'direct' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          💬 Admin Support Chat
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('group')}
          className={`pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 px-1
            ${activeTab === 'group' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          🌐 Global Q&A Forum
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'direct' ? (
          <div className="flex h-[580px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
            
            {/* Left Panel: Search & Admin Directory */}
            <div className="w-1/3 border-r border-gray-200 p-4 flex flex-col bg-gray-50/50">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">Admin Support Desk</h3>

              {/* Search Field */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search administrator name or email..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
              />

              {/* Admin Results List */}
              <div className="mt-3 overflow-y-auto flex-1 space-y-2 pr-1">
                {searching ? (
                  <div className="text-center py-6 text-xs text-gray-400">Searching admin directory...</div>
                ) : usersList.length > 0 ? (
                  usersList.map((user) => {
                    const isSelected = activeRecipient?._id === user._id;
                    return (
                      <div
                        key={user._id}
                        onClick={() => handleSelectUser(user)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all flex justify-between items-center ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-200 shadow-2xs'
                            : 'bg-white border-gray-200 hover:bg-gray-100/70'
                        }`}
                      >
                        <div className="overflow-hidden flex items-center gap-2.5">
                          {/* Live Presence Indicator Badge */}
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                user.isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                              }`}
                            />
                          </div>

                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {user.isOnline ? (
                                <span className="text-emerald-600 font-medium">Online</span>
                              ) : (
                                formatLastSeen(user.lastSeen)
                              )}
                            </p>
                          </div>
                        </div>

                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ml-2 shrink-0 bg-purple-100 text-purple-700">
                          Admin
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No support administrators found.
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Chat Frame */}
            <div className="w-2/3 flex flex-col h-full">
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-400 animate-pulse">
                  Connecting to support room...
                </div>
              ) : conversation ? (
                <ChatWindow 
                  roomId={activeRoomId} 
                  currentUser={currentUser} 
                  recipient={activeRecipient} 
                  isGroupPost={false} 
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center bg-gray-50/20">
                  <div className="w-10 h-10 mb-2 text-indigo-500 border border-indigo-200 rounded-full flex items-center justify-center bg-indigo-50">
                    🛡️
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Admin Support Messaging</p>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">
                    Select an administrator from the list on the left to start a 1-to-1 support conversation.
                  </p>
                </div>
              )}
            </div>

          </div>
        ) : (
          <ChatWindow currentUser={currentUser} isGroupPost={true} />
        )}
      </div>
    </div>
  );
};

export default StudentChatPage;