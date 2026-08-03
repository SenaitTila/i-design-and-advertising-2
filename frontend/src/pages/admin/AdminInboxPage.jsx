import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import API, { socket } from '../../api/authApi';
import ChatWindow from '../../components/chat/ChatWindow';

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

// Helper function to sort conversations by most recent chat/update time
const sortByLastChat = (conversationsList) => {
  return [...conversationsList].sort((a, b) => {
    const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
};

const AdminInboxPage = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [conversations, setConversations] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // New Chat Modal state (Restricted to Student Lookup)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Mobile navigation state
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Pre-composed voucher text state
  const [pendingVoucherText, setPendingVoucherText] = useState('');

  const { fetchUnreadCounts } = useOutletContext() || {};

  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();

  const getOtherParticipant = useCallback(
    (participants) => {
      if (!Array.isArray(participants)) return null;
      return (
        participants.find((p) => {
          const pId = typeof p === 'object' ? (p._id || p.id) : p;
          return pId?.toString() !== currentUserId;
        }) || participants[0]
      );
    },
    [currentUserId]
  );

  const getUserDisplayName = (user) => {
    if (!user) return 'User';
    if (user.name) return user.name;
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.username || user.email || 'User';
  };

  // 1. Intercept prefilled query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const prefilledMessage = queryParams.get('prefilledMessage');

    if (prefilledMessage) {
      setPendingVoucherText(decodeURIComponent(prefilledMessage));
      const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }, []);

  // 2. Auth Socket Connection & Status Listeners
  useEffect(() => {
    if (!currentUserId) return;

    socket.auth = { userId: currentUserId };

    const onConnect = () => {
      socket.emit('user_connected', currentUserId);
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      onConnect();
    }

    socket.on('connect', onConnect);

    const handleConversationUpdate = (updatedRoom) => {
      setConversations((prevRooms) => {
        const targetId = (updatedRoom._id || updatedRoom.id)?.toString();
        const map = new Map(prevRooms.map((r) => [(r._id || r.id)?.toString(), r]));
        map.set(targetId, updatedRoom);

        return sortByLastChat(Array.from(map.values()));
      });

      if (activeRoomId === (updatedRoom._id || updatedRoom.id)?.toString() && fetchUnreadCounts) {
        setTimeout(() => fetchUnreadCounts(), 100);
      }
    };

    const handleStatusChange = ({ userId, isOnline, lastSeen }) => {
      const targetStrId = userId?.toString();

      setConversations((prevRooms) =>
        prevRooms.map((room) => {
          const updatedParticipants = room.participants?.map((p) => {
            const pId = typeof p === 'object' ? (p._id || p.id)?.toString() : p?.toString();
            return pId === targetStrId ? { ...p, isOnline, lastSeen } : p;
          });
          return { ...room, participants: updatedParticipants };
        })
      );
    };

    socket.on('conversation_updated', handleConversationUpdate);
    socket.on('user_status_changed', handleStatusChange);

    return () => {
      socket.off('connect', onConnect);
      socket.off('conversation_updated', handleConversationUpdate);
      socket.off('user_status_changed', handleStatusChange);
    };
  }, [currentUserId, activeRoomId, fetchUnreadCounts]);

  // 3. Fetch Conversations
  const fetchInboundInbox = async () => {
    try {
      setLoading(true);
      const res = await API.get('/chat/admin/conversations');
      const chatData = res.data?.data || res.data?.conversations || res.data || [];
      const sanitizedData = Array.isArray(chatData) ? chatData : [];

      const uniqueData = Array.from(
        new Map(sanitizedData.map((c) => [(c._id || c.id)?.toString(), c])).values()
      );

      const sortedData = sortByLastChat(uniqueData);
      setConversations(sortedData);

      if (sortedData.length > 0 && activeTab === 'tickets' && !activeRoomId) {
        setActiveRoomId((sortedData[0]._id || sortedData[0].id)?.toString());
      }
    } catch (err) {
      console.error('Failed loading inbox conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInboundInbox();
  }, []);

  // Derive active conversation & unread counts
  const activeConversation = useMemo(() => {
    return conversations.find((c) => (c._id || c.id)?.toString() === activeRoomId?.toString());
  }, [conversations, activeRoomId]);

  const activeRecipient = useMemo(() => {
    return getOtherParticipant(activeConversation?.participants);
  }, [activeConversation, getOtherParticipant]);

  const activeRoomUnreadRecord = activeConversation?.unreadCounts?.find((u) => {
    const unreadUserId = typeof u.user === 'object' ? (u.user?._id || u.user?.id) : u.user;
    return unreadUserId?.toString() === currentUserId;
  });

  const activeRoomUnreadCount = activeRoomUnreadRecord ? activeRoomUnreadRecord.count : 0;

  // 4. Reset Unread Notifications
  useEffect(() => {
    if (activeTab === 'tickets' && activeRoomId && currentUserId && activeRoomUnreadCount > 0) {
      const clearNotifications = async () => {
        try {
          await API.put(`/chat/conversation/${activeRoomId}/clear-unread`, {}, { _skipGlobalLoading: true });

          setConversations((prevRooms) =>
            prevRooms.map((r) => {
              const roomId = (r._id || r.id)?.toString();
              if (roomId === activeRoomId?.toString()) {
                return {
                  ...r,
                  unreadCounts: r.unreadCounts?.map((u) => {
                    const uId = typeof u.user === 'object' ? (u.user?._id || u.user?.id) : u.user;
                    return uId?.toString() === currentUserId ? { ...u, count: 0 } : u;
                  }),
                };
              }
              return r;
            })
          );

          if (fetchUnreadCounts) fetchUnreadCounts();
        } catch (err) {
          console.error('Failed to clear notification indexes:', err);
        }
      };

      clearNotifications();
    }
  }, [activeRoomId, activeTab, activeRoomUnreadCount, currentUserId, fetchUnreadCounts]);

  // Search Directory — Restricted purely to role=student
  const fetchStudents = async (query = '') => {
    try {
      setLoadingStudents(true);
      const endpoint = `/chat/search?q=${encodeURIComponent(query)}&role=student`;
      const res = await API.get(endpoint, { _skipGlobalLoading: true });
      const fetched = res.data?.data || res.data || [];

      const sanitizedFetched = Array.isArray(fetched) ? fetched : [];

      // Filter to retain student role users only
      const studentsOnly = sanitizedFetched.filter(
        (u) => (u.role || 'student').toLowerCase() === 'student'
      );

      const uniqueStudents = Array.from(
        new Map(studentsOnly.map((u) => [(u._id || u.id)?.toString(), u])).values()
      );

      setStudents(uniqueStudents);
    } catch (err) {
      console.error('Failed to fetch student list:', err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenNewChatModal = () => {
    setIsModalOpen(true);
    setStudentSearch('');
    fetchStudents('');
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const timer = setTimeout(() => {
      fetchStudents(studentSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [studentSearch, isModalOpen]);

  // 💬 Continuation & Selection Logic for Chat Rooms
  const handleStartNewChat = async (targetUser) => {
    try {
      const targetStrId = (targetUser._id || targetUser.id)?.toString();

      // Guard check: ensure room creation is limited to students
      if (targetUser.role && targetUser.role.toLowerCase() !== 'student') {
        console.warn('Admins can only open new direct messaging rooms with students.');
        return;
      }

      // 1. Check local state first for existing room
      const existingChat = conversations.find((chat) =>
        chat.participants?.some((p) => {
          const pId = typeof p === 'object' ? (p._id || p.id) : p;
          return pId?.toString() === targetStrId;
        })
      );

      if (existingChat) {
        const existingRoomId = (existingChat._id || existingChat.id)?.toString();
        setActiveRoomId(existingRoomId);
        setShowMobileChat(true);
        setIsModalOpen(false);
        return;
      }

      // 2. Query or create backend room
      const res = await API.post(
        '/chat/conversation',
        { targetUserId: targetStrId },
        { _skipGlobalLoading: true }
      );

      const roomData = res.data?.data || res.data?.conversation || res.data;
      const roomId = (roomData._id || roomData.id)?.toString();

      if (!roomId) {
        console.error('Failed to retrieve valid room ID');
        return;
      }

      // 3. Upsert into local state and re-sort by chat time
      setConversations((prev) => {
        const map = new Map(prev.map((c) => [(c._id || c.id)?.toString(), c]));
        map.set(roomId, roomData);
        return sortByLastChat(Array.from(map.values()));
      });

      // 4. Activate room and switch focus
      setActiveRoomId(roomId);
      setShowMobileChat(true);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to start or locate conversation:', err);
    }
  };

  const handleSelectRoom = (roomId) => {
    setActiveRoomId(roomId?.toString());
    setShowMobileChat(true);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'forum') {
      setActiveRoomId(null);
    } else if (conversations.length > 0) {
      setActiveRoomId((conversations[0]._id || conversations[0].id)?.toString());
    }
  };

  const filteredConversations = useMemo(() => {
    const sortedList = sortByLastChat(
      Array.from(new Map(conversations.map((c) => [(c._id || c.id)?.toString(), c])).values())
    );

    if (!searchQuery.trim()) return sortedList;
    const term = searchQuery.toLowerCase().trim();

    return sortedList.filter((chat) => {
      const counterpart = getOtherParticipant(chat.participants);
      const name = getUserDisplayName(counterpart).toLowerCase();
      const email = (counterpart?.email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [conversations, searchQuery, getOtherParticipant]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-full bg-white overflow-hidden text-left">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 py-1.5 sm:px-4 flex items-center justify-between gap-2 shrink-0 h-12">
        <h1 className="text-base font-bold text-gray-900 tracking-tight truncate">
          Messages Desk
        </h1>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('tickets')}
            className={`py-1 px-2.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tickets' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span>💬 Direct Inbox</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('forum')}
            className={`py-1 px-2.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'forum' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span>🌐 Global Q&A Forum</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative">
        {activeTab === 'forum' ? (
          <div className="h-full p-1 sm:p-2 bg-white">
            <ChatWindow currentUser={currentUser} isGroupPost={true} />
          </div>
        ) : (
          <div className="flex h-full w-full bg-white overflow-hidden">
            {/* Sidebar Inbox List */}
            <div
              className={`w-full md:w-72 lg:w-80 border-r border-gray-200 flex flex-col h-full bg-white transition-all shrink-0 ${
                showMobileChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="p-2 border-b border-gray-100 bg-gray-50/60 flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Search user or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-xs bg-white border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleOpenNewChatModal}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors flex items-center justify-center shrink-0"
                  title="New Student Chat"
                >
                  ➕
                </button>
              </div>

              {/* Conversations Feed */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {loading ? (
                  <div className="p-4 text-center text-xs text-gray-400 animate-pulse">
                    Loading conversations...
                  </div>
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map((chat) => {
                    const roomId = (chat._id || chat.id)?.toString();
                    const isSelected = activeRoomId === roomId;
                    const counterpart = getOtherParticipant(chat.participants);
                    const name = getUserDisplayName(counterpart);

                    const unreadRecord = chat.unreadCounts?.find((u) => {
                      const uId = typeof u.user === 'object' ? (u.user?._id || u.user?.id) : u.user;
                      return uId?.toString() === currentUserId;
                    });
                    const unreadCount = unreadRecord ? unreadRecord.count : 0;

                    return (
                      <div
                        key={roomId}
                        onClick={() => handleSelectRoom(roomId)}
                        className={`p-3 cursor-pointer transition-colors flex items-center gap-3 ${
                          isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center uppercase">
                            {name.charAt(0)}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              counterpart?.isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-900 truncate">{name}</p>
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">
                            {counterpart?.isOnline ? (
                              <span className="text-emerald-600 font-medium">Online</span>
                            ) : (
                              formatLastSeen(counterpart?.lastSeen)
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-gray-400">No active conversations found.</div>
                )}
              </div>
            </div>

            {/* Chat Window Container */}
            <div
              className={`flex-1 flex flex-col h-full bg-gray-50/30 ${
                !showMobileChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Mobile Back Button */}
              {showMobileChat && (
                <div className="md:hidden p-2 bg-white border-b border-gray-200 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowMobileChat(false)}
                    className="text-xs font-semibold text-indigo-600 flex items-center gap-1 cursor-pointer"
                  >
                    ← Back to Conversations
                  </button>
                </div>
              )}

              {activeRoomId ? (
                <ChatWindow
                  roomId={activeRoomId}
                  currentUser={currentUser}
                  recipient={activeRecipient}
                  isGroupPost={false}
                  initialText={pendingVoucherText}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <div className="w-12 h-12 mb-3 text-indigo-500 border border-indigo-200 rounded-full flex items-center justify-center bg-indigo-50">
                    ✉️
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Select a Conversation</p>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">
                    Choose a conversation from the left sidebar or click ➕ to launch a new student chat.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Direct Student Message Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
              <h3 className="font-semibold text-sm text-gray-800">Start Student Conversation</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 space-y-2">
              <input
                type="text"
                placeholder="Search student by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 divide-y divide-gray-100">
              {loadingStudents ? (
                <div className="p-4 text-center text-xs text-gray-400">Searching student directory...</div>
              ) : students.length > 0 ? (
                students.map((u) => {
                  const targetId = (u._id || u.id)?.toString();
                  if (targetId === currentUserId) return null;

                  return (
                    <div
                      key={targetId}
                      onClick={() => handleStartNewChat(u)}
                      className="p-2.5 hover:bg-indigo-50/60 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                            {getUserDisplayName(u).charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                              u.isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                          />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {getUserDisplayName(u)}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>

                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 shrink-0 ml-2">
                        Student
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-gray-400">No matching students found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInboxPage;