import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import API from '../../api/authApi';

const SOCKET_URL = API.defaults.baseURL 
  ? API.defaults.baseURL.replace(/\/api\/v1\/?$/, '') 
  : 'http://localhost:5000';

export const socket = io(SOCKET_URL, { 
  autoConnect: false, 
  withCredentials: true 
});

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

const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatWindow = ({ 
  roomId, 
  currentUser, 
  recipient: initialRecipient, 
  isGroupPost = false,
  prefilledMessage = '',
  onPrefilledMessageApplied
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [recipient, setRecipient] = useState(initialRecipient);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const chatEndRef = useRef(null);
  const menuRef = useRef(null);

  const targetRoom = isGroupPost ? 'global_qa' : roomId;
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();

  // 1. Ingest prefilled message
  useEffect(() => {
    if (prefilledMessage) {
      setInput(prefilledMessage);
      if (onPrefilledMessageApplied) onPrefilledMessageApplied();
    }
  }, [prefilledMessage, onPrefilledMessageApplied]);

  // 2. Ensure Socket Connection
  useEffect(() => {
    if (currentUser && !socket.connected) {
      socket.connect();
    }
  }, [currentUser]);

  // 3. Sync recipient & status
  useEffect(() => {
    setRecipient(initialRecipient);
    setIsBlocked(Boolean(initialRecipient?.isBlockedByAdmin || initialRecipient?.blocked));
  }, [initialRecipient]);

  // 4. Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // 5. User presence tracking
  useEffect(() => {
    const recipientId = (recipient?._id || recipient?.id)?.toString();
    if (isGroupPost || !recipientId) return;

    const handleStatusChange = ({ userId, isOnline, lastSeen }) => {
      if (String(userId) === recipientId) {
        setRecipient((prev) => (prev ? { ...prev, isOnline, lastSeen } : prev));
      }
    };

    socket.on('user_status_changed', handleStatusChange);
    return () => socket.off('user_status_changed', handleStatusChange);
  }, [recipient?._id, recipient?.id, isGroupPost]);

  // 6. Fetch History & Handle Real-time Messages
  useEffect(() => {
    if (!isGroupPost && !roomId) return;

    setMessages([]);
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        const url = isGroupPost ? '/chat/group-qa' : `/chat/messages/${roomId}`;
        const res = await API.get(url, { _skipGlobalLoading: true });

        if (!isMounted) return;
        const historyData = Array.isArray(res.data) 
          ? res.data 
          : res.data?.data || res.data?.messages || [];

        setMessages(historyData);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };

    fetchHistory();
    socket.emit('join_room', targetRoom);

    const handleIncomingMessage = (msg) => {
      const msgRoomId = msg.isGroupPost ? 'global_qa' : msg.conversationId;
      if (msgRoomId && msgRoomId !== targetRoom) return;

      setMessages((prev) => {
        const incomingId = (msg._id || msg.id)?.toString();
        const incomingTempId = msg.tempId?.toString();
        const incomingSenderId = typeof msg.sender === 'object' ? (msg.sender?._id || msg.sender?.id) : msg.sender;

        // Check for duplicates
        const existingIndex = prev.findIndex((m) => {
          const mId = (m._id || m.id)?.toString();
          const mTempId = m.tempId?.toString();
          const mSenderId = typeof m.sender === 'object' ? (m.sender?._id || m.sender?.id) : m.sender;

          if (incomingId && mId === incomingId) return true;
          if (incomingTempId && mTempId === incomingTempId) return true;
          if (mTempId && m.text === msg.text && String(mSenderId) === String(incomingSenderId)) return true;

          return false;
        });

        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = msg;
          return updated;
        }

        return [...prev, msg];
      });
    };

    socket.on('receive_message', handleIncomingMessage);

    return () => {
      isMounted = false;
      socket.off('receive_message', handleIncomingMessage);
      if (targetRoom) {
        socket.emit('leave_room', targetRoom);
      }
    };
  }, [roomId, isGroupPost, targetRoom]);

  // 7. Auto-scroll on message updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 8. Send Message
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isBlocked) return;

    if (!currentUserId) {
      console.error('Missing active user context.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const payload = {
      tempId,
      conversationId: isGroupPost ? undefined : roomId,
      recipientId: (recipient?._id || recipient?.id)?.toString(),
      isGroupPost,
      sender: {
        _id: currentUserId,
        name: currentUser?.name || 'You',
        role: currentUser?.role || 'user'
      },
      text: input.trim(),
      createdAt: new Date().toISOString()
    };

    // Optimistic UI push
    setMessages((prev) => [...prev, payload]);
    socket.emit('send_message', payload);
    setInput('');
  };

  // 9. Block / Unblock User
  const handleToggleBlockUser = async () => {
    const targetId = (recipient?._id || recipient?.id)?.toString();
    if (!targetId) return;

    const newBlockState = !isBlocked;
    setIsBlocked(newBlockState);
    setShowMenu(false);

    try {
      await API.post(`/chat/user/${targetId}/block`, { block: newBlockState });
    } catch (err) {
      console.error('Failed to update block status:', err);
      setIsBlocked(!newBlockState);
    }
  };

  const recipientName = recipient?.name || recipient?.username || 'User';

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden w-full min-w-0">
      
      {/* Header Area */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          {!isGroupPost && recipient && (
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center uppercase">
                {recipientName.charAt(0)}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  recipient.isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              />
            </div>
          )}

          <div className="flex flex-col text-left min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm text-gray-800 truncate">
                {isGroupPost ? '🌐 Community Discussion Board' : recipient ? recipientName : '💬 Private Messaging'}
              </span>

              {!isGroupPost && recipient?.role && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                  recipient.role === 'admin' 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : recipient.role === 'instructor' || recipient.role === 'teacher'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {recipient.role}
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-500 truncate mt-0.5">
              {isGroupPost ? (
                'Open forum for all members'
              ) : recipient ? (
                isBlocked ? (
                  <span className="text-red-500 font-medium">User is blocked</span>
                ) : recipient.isOnline ? (
                  <span className="text-emerald-600 font-medium">Active now</span>
                ) : (
                  `Last seen ${formatLastSeen(recipient.lastSeen)}`
                )
              ) : (
                'Select a recipient to view details'
              )}
            </p>
          </div>
        </div>

        {/* Action Menu */}
        {!isGroupPost && recipient && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="Chat Options"
            >
              ⋮
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 text-xs">
                <button
                  type="button"
                  onClick={handleToggleBlockUser}
                  className={`w-full text-left px-3 py-2 font-medium transition-colors cursor-pointer ${
                    isBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  {isBlocked ? '🔓 Unblock User' : '🚫 Block User'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-gray-50/50 min-w-0">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, i) => {
            const rawSenderId = typeof msg.sender === 'object' ? (msg.sender?._id || msg.sender?.id) : msg.sender;
            const isMe = Boolean(rawSenderId && currentUserId && String(rawSenderId) === String(currentUserId));

            const senderObj = typeof msg.sender === 'object' ? msg.sender : null;
            const senderName = isMe ? 'You' : (senderObj?.name || recipientName);
            const senderRole = senderObj?.role || (isMe ? currentUser?.role : recipient?.role);

            // Enforce key uniqueness across database IDs, temp IDs, and array indices
            const uniqueKey = msg._id || msg.id || msg.tempId || `msg-${i}`;

            return (
              <div 
                key={uniqueKey} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full min-w-0`}
              >
                {/* Sender Metadata */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-gray-400 font-medium">
                  <span>{senderName}</span>
                  {senderRole && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                      senderRole === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : senderRole === 'instructor' || senderRole === 'teacher'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {senderRole}
                    </span>
                  )}
                  {msg.createdAt && (
                    <span className="text-[10px] text-gray-400 ml-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] sm:max-w-[75%] min-w-0 px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-2xs break-words whitespace-pre-wrap [overflow-wrap:anywhere] ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-200/80'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Tray */}
      {isBlocked ? (
        <div className="p-3 bg-red-50 border-t border-red-100 text-center text-xs text-red-600 font-medium shrink-0">
          This user is blocked. Unblock them from the top menu to resume messaging.
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-2.5 sm:p-3 bg-white border-t border-gray-200 flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isGroupPost 
                ? "Share a question or challenge with everyone..." 
                : recipient ? `Send message to ${recipientName}...` : "Type a message..."
            }
            className="flex-1 min-w-0 px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder:text-gray-400"
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            Send
          </button>
        </form>
      )}

    </div>
  );
};

export default ChatWindow;