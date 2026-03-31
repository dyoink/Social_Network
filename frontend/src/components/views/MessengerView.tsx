import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Loader, AlertCircle, MessageSquare } from 'lucide-react';
import { getSocialNetworkApiV1, type ConversationDto, type MessageDto } from '../../api/api-generated';
import { getChatConnection } from '../../api/signalr';
import useAuthStore from '../../store/authStore';
import { timeAgo } from '../../utils/time';

// ─── ConversationItem ──────────────────────────────────────────────────────────

interface ConversationItemProps {
  conv: ConversationDto;
  active: boolean;
  currentUserId: number;
  onlineUserIds: Set<number>;
  onClick: () => void;
}

const ConversationItem = ({ conv, active, currentUserId, onlineUserIds, onClick }: ConversationItemProps) => {
  const other  = conv.participants?.[0];
  const name   = other?.fullName || other?.username || 'Unknown';
  const avatar = other?.avatarUrl || `https://picsum.photos/seed/${other?.id}/50/50`;
  const lastMsg = conv.lastMessage?.content ? conv.lastMessage.content.slice(0, 40) + (conv.lastMessage.content.length > 40 ? '…' : '') : 'Bắt đầu cuộc trò chuyện';
  const isMine      = conv.lastMessage?.senderId === currentUserId;
  const unreadCount  = Number(conv.unreadCount ?? 0);
  const isOnline = other?.id ? onlineUserIds.has(Number(other.id)) : false;

  return (
    <div
      className={`p-4 rounded-xl flex gap-4 cursor-pointer transition-all ${active ? 'bg-surface-container-lowest shadow-sm border-l-4 border-primary' : 'hover:bg-surface-container-lowest'}`}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        <img alt={name} className="w-12 h-12 rounded-full object-cover" src={avatar} referrerPolicy="no-referrer" />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h4 className={`font-bold truncate ${active ? 'text-on-surface' : 'text-on-surface hover:text-primary'}`}>{name}</h4>
          <span className={`text-[10px] font-semibold flex-shrink-0 ml-2 ${active ? 'text-primary' : 'text-outline'}`}>
            {conv.lastMessage?.createdAt ? timeAgo(conv.lastMessage.createdAt) : ''}
          </span>
        </div>
        <p className={`text-sm truncate ${active ? 'text-on-surface-variant font-medium' : 'text-outline'}`}>
          {isMine ? 'Bạn: ' : ''}{lastMsg}
        </p>
        {unreadCount > 0 && !active && (
          <span className="inline-block bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5">
            {conv.unreadCount}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── MessageBubble ─────────────────────────────────────────────────────────────

const MessageBubble = ({ msg, isSent }: { msg: MessageDto; isSent: boolean }) => (
  <div className={`flex flex-col ${isSent ? 'items-end self-end' : 'items-start'} max-w-[80%]`}>
    <div className={`p-4 rounded-xl ${isSent ? 'bg-gradient-to-br from-primary to-primary-container text-white rounded-br-none shadow-lg shadow-primary/10' : 'bg-surface-container-low text-on-surface rounded-bl-none shadow-sm'}`}>
      <p className="text-sm leading-relaxed">{msg.content}</p>
    </div>
    <span className="text-[10px] text-outline mt-1 px-1">{timeAgo(msg.createdAt)}</span>
  </div>
);

// ─── MessengerView ─────────────────────────────────────────────────────────────

interface MessengerViewProps {
  /** Mở conversation với user cụ thể (từ nút "Nhắn tin" trên Profile) */
  targetUserId?: number | null;
}

const MessengerView = ({ targetUserId }: MessengerViewProps = {}) => {
  const api = getSocialNetworkApiV1();
  const { user: currentUser } = useAuthStore();
  const currentUserId = Number(currentUser?.id ?? 0);

  const [conversations,   setConversations]   = useState<ConversationDto[]>([]);
  const [convLoading,     setConvLoading]     = useState(true);
  const [activeConvId,    setActiveConvId]    = useState<number | null>(null);

  const [messages,        setMessages]        = useState<MessageDto[]>([]);
  const [msgLoading,      setMsgLoading]      = useState(false);
  const [msgError,        setMsgError]        = useState<string | null>(null);

  const [newMessage,      setNewMessage]      = useState('');
  const [sending,         setSending]         = useState(false);
  const [typingUser,      setTypingUser]      = useState<number | null>(null);
  const [onlineUserIds,   setOnlineUserIds]   = useState<Set<number>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConvRef = useRef<number | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SignalR connection
  const chatConn = getChatConnection();

  // ─── SignalR event listeners ───────────────────────────────────────────────
  const onReceiveMessage = useCallback((msg: MessageDto) => {
    // Chỉ append nếu tin nhắn thuộc conversation đang mở
    setMessages(prev => {
      // Tránh duplicate (nếu gửi từ chính mình qua REST đã append)
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    // Cập nhật last message trong sidebar
    setConversations(prev =>
      prev.map(c => Number(c.id) === msg.conversationId
        ? { ...c, lastMessage: msg }
        : c
      )
    );
    setTypingUser(null);
  }, []);

  const onConversationUpdated = useCallback((data: { conversationId: number; lastMessage: MessageDto }) => {
    setConversations(prev =>
      prev.map(c => Number(c.id) === data.conversationId
        ? { ...c, lastMessage: data.lastMessage, unreadCount: (Number(c.unreadCount ?? 0)) + 1 }
        : c
      )
    );
  }, []);

  const onUserTyping = useCallback((data: { userId: number; conversationId: number }) => {
    if (data.userId !== currentUserId) {
      setTypingUser(data.userId);
      // Auto-clear typing indicator sau 3s
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
    }
  }, [currentUserId]);

  const onUserStopTyping = useCallback((_data: { userId: number; conversationId: number }) => {
    setTypingUser(null);
  }, []);

  // Đăng ký SignalR events 1 lần
  useEffect(() => {
    chatConn.on('ReceiveMessage', onReceiveMessage);
    chatConn.on('ConversationUpdated', onConversationUpdated);
    chatConn.on('UserTyping', onUserTyping);
    chatConn.on('UserStopTyping', onUserStopTyping);

    // Online status tracking
    const onUserOnline = (userId: number) => {
      setOnlineUserIds(prev => new Set(prev).add(userId));
    };
    const onUserOffline = (userId: number) => {
      setOnlineUserIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
    };
    chatConn.on('UserOnline', onUserOnline);
    chatConn.on('UserOffline', onUserOffline);

    // Lấy danh sách online hiện tại
    chatConn.invoke('GetOnlineUsers')
      .then((ids: number[]) => setOnlineUserIds(new Set(ids)))
      .catch(() => {});

    return () => {
      chatConn.off('ReceiveMessage', onReceiveMessage);
      chatConn.off('ConversationUpdated', onConversationUpdated);
      chatConn.off('UserTyping', onUserTyping);
      chatConn.off('UserStopTyping', onUserStopTyping);
      chatConn.off('UserOnline', onUserOnline);
      chatConn.off('UserOffline', onUserOffline);
    };
  }, [chatConn, onReceiveMessage, onConversationUpdated, onUserTyping, onUserStopTyping]);

  // Load conversations
  useEffect(() => {
    setConvLoading(true);
    api.getApiConversations({ page: 1, pageSize: 30 })
      .then(res => { if (res.success && res.data) setConversations(res.data.items ?? []); })
      .catch(console.error)
      .finally(() => setConvLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tự động mở conversation với targetUserId (từ Profile "Nhắn tin")
  useEffect(() => {
    if (!targetUserId || targetUserId === currentUserId) return;
    api.postApiConversations({ targetUserId })
      .then(res => {
        if (res.success && res.data) {
          const convId = Number(res.data.id);
          setActiveConvId(convId);
          // Thêm conversation vào danh sách nếu chưa có
          setConversations(prev => {
            if (prev.some(c => Number(c.id) === convId)) return prev;
            return [res.data!, ...prev];
          });
        }
      })
      .catch(console.error);
  }, [targetUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join/Leave SignalR group khi chuyển conversation
  useEffect(() => {
    const prev = prevConvRef.current;
    if (prev !== null && prev !== activeConvId) {
      chatConn.invoke('LeaveConversation', prev).catch(console.error);
    }
    if (activeConvId !== null) {
      chatConn.invoke('JoinConversation', activeConvId).catch(console.error);
    }
    prevConvRef.current = activeConvId;
  }, [activeConvId, chatConn]);

  // Load messages khi chọn conversation
  useEffect(() => {
    if (activeConvId === null) return;
    setMsgLoading(true);
    setMsgError(null);
    setTypingUser(null);
    api.getApiConversationsIdMessages(activeConvId, { page: 1, pageSize: 50 })
      .then(res => {
        if (res.success && res.data) {
          // API trả về mới nhất trước, reverse để hiển thị cũ → mới
          setMessages([...(res.data.items ?? [])].reverse());
        } else {
          setMsgError(res.message ?? 'Lỗi tải tin nhắn');
        }
      })
      .catch(() => setMsgError('Không thể tải tin nhắn.'))
      .finally(() => setMsgLoading(false));

    // Đánh dấu đã đọc
    api.putApiConversationsIdRead(activeConvId).catch(console.error);
    setConversations(prev =>
      prev.map(c => Number(c.id) === activeConvId ? { ...c, unreadCount: 0 } : c)
    );
  }, [activeConvId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gửi typing indicator khi gõ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (activeConvId && e.target.value.trim()) {
      chatConn.invoke('Typing', activeConvId).catch(() => {});
    }
  };

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || !activeConvId || sending) return;
    setSending(true);
    try {
      // Gửi qua SignalR hub (hub tự lưu DB + broadcast)
      await chatConn.invoke('SendMessage', activeConvId, content);
      setNewMessage('');
      chatConn.invoke('StopTyping', activeConvId).catch(() => {});
    } catch {
      // Fallback sang REST nếu SignalR lỗi
      try {
        const res = await api.postApiConversationsIdMessages(activeConvId, { conversationId: activeConvId, content });
        if (res.success && res.data) {
          setMessages(prev => [...prev, res.data!]);
          setNewMessage('');
          setConversations(prev =>
            prev.map(c => Number(c.id) === activeConvId ? { ...c, lastMessage: res.data } : c)
          );
        }
      } catch { /* ignore */ }
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(c => Number(c.id) === activeConvId);
  const otherUser  = activeConv?.participants?.[0];

  return (
    <div className="bg-surface-container-lowest rounded-xl surface-elevation-tonal flex h-[calc(100vh-160px)] overflow-hidden border border-outline-variant/10">
      {/* Conversation list */}
      <div className="w-1/3 border-r border-surface-container flex flex-col">
        <div className="p-6 flex items-center justify-between border-b border-surface-container">
          <h2 className="text-2xl font-headline font-extrabold tracking-tight">Tin nhắn</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {convLoading && (
            <div className="flex justify-center py-8">
              <Loader className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {!convLoading && conversations.length === 0 && (
            <div className="text-center py-8 text-outline text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Chưa có cuộc trò chuyện nào
            </div>
          )}
          {conversations.map(conv => (
            <React.Fragment key={Number(conv.id)}>
              <ConversationItem
                conv={conv}
                active={Number(conv.id) === activeConvId}
                currentUserId={currentUserId}
                onlineUserIds={onlineUserIds}
                onClick={() => setActiveConvId(Number(conv.id))}
              />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {activeConvId === null ? (
          <div className="flex-1 flex items-center justify-center text-outline">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-headline">Chọn một cuộc trò chuyện</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="p-4 flex items-center justify-between border-b border-surface-container">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    alt={otherUser?.fullName || ''}
                    className="w-10 h-10 rounded-full object-cover"
                    src={otherUser?.avatarUrl || `https://picsum.photos/seed/${otherUser?.id}/50/50`}
                    referrerPolicy="no-referrer"
                  />
                  {otherUser?.id && onlineUserIds.has(Number(otherUser.id)) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-surface rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-on-surface leading-tight">
                    {otherUser?.fullName || otherUser?.username || 'Unknown'}
                  </h3>
                  <p className="text-xs text-outline">
                    {otherUser?.id && onlineUserIds.has(Number(otherUser.id))
                      ? <span className="text-green-500 font-medium">Đang hoạt động</span>
                      : <>@{otherUser?.username}</>
                    }
                  </p>
                </div>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
              {msgLoading && (
                <div className="flex justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              {msgError && (
                <div className="flex items-center gap-2 text-error text-xs p-3 rounded-lg bg-error/10">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{msgError}</span>
                </div>
              )}
              {messages.map(msg => (
                <React.Fragment key={msg.id}>
                  <MessageBubble msg={msg} isSent={msg.senderId === currentUserId} />
                </React.Fragment>
              ))}
              {typingUser && (
                <div className="flex items-center gap-2 text-outline text-xs animate-pulse">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Đang nhập...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <footer className="p-6 bg-surface-container-low/50 backdrop-blur-md border-t border-surface-container">
              <div className="bg-surface-container-low rounded-full p-2 flex items-center gap-2">
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 text-on-surface placeholder:text-outline"
                  placeholder="Nhập tin nhắn..."
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="bg-primary text-white p-2 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-transform disabled:opacity-50"
                >
                  {sending ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

export default MessengerView;
