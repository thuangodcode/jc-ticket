import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { chatService, type ChatMessage, type ChatRoom } from '../../services/chatService';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserAuth } from '../../contexts/useUserAuth';
import { Search, Send, MessageSquare, Loader2, Sparkles } from 'lucide-react';


export default function AdminSupportPage() {
  const { isDark } = useTheme();
  const { user } = useUserAuth();
  const { socket, isConnected } = useSocket();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [unreadRooms, setUnreadRooms] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cuộn xuống cuối khung chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isUserTyping]);

  // Load danh sách phòng chat ban đầu
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoadingRooms(true);
        const data = await chatService.getActiveRooms();
        setRooms(data);
      } catch (err) {
        console.error('Failed to fetch active chat rooms:', err);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  // Lắng nghe các sự kiện Socket.io
  useEffect(() => {
    if (!socket) return;

    // Lắng nghe khi có tin nhắn mới toàn cục (để cập nhật danh sách phòng)
    const handleNewUserMessage = (data: any) => {
      setRooms((prevRooms) => {
        // Kiểm tra xem phòng đã tồn tại trong danh sách chưa
        const existsIndex = prevRooms.findIndex((r) => r.room === data.room);
        const updatedRoom: ChatRoom = {
          room: data.room,
          lastMessage: data.lastMessage,
          lastMessageSender: data.lastMessageSender,
          lastMessageRole: data.lastMessageRole,
          lastMessageAt: data.lastMessageAt,
          user: data.user,
        };

        let newRooms = [...prevRooms];
        if (existsIndex > -1) {
          // Cập nhật tin nhắn cuối cùng và đẩy lên đầu danh sách
          newRooms.splice(existsIndex, 1);
        }
        newRooms.unshift(updatedRoom);
        return newRooms;
      });

      // Nếu không phải là phòng đang chọn, đánh dấu là chưa đọc
      if (!selectedRoom || selectedRoom.room !== data.room) {
        setUnreadRooms((prev) => {
          const next = new Set(prev);
          next.add(data.room);
          return next;
        });
      }
    };

    // Lắng nghe tin nhắn mới trong phòng chat hiện tại
    const handleReceiveMessage = (message: ChatMessage) => {
      if (selectedRoom && message.room === selectedRoom.room) {
        setMessages((prev) => [...prev, message]);
        // Tắt trạng thái gõ phím của khách hàng khi họ đã gửi tin
        setIsUserTyping(false);
      }
    };

    // Lắng nghe sự kiện khách hàng đang gõ phím
    const handleUserTyping = (data: { room: string; name: string; role: string; isTyping: boolean }) => {
      if (selectedRoom && data.room === selectedRoom.room && data.role === 'user') {
        setIsUserTyping(data.isTyping);
      }
    };

    socket.on('new_user_message', handleNewUserMessage);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('new_user_message', handleNewUserMessage);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, selectedRoom]);

  // Load tin nhắn của phòng được chọn
  useEffect(() => {
    if (!selectedRoom) return;

    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        setIsUserTyping(false);
        const history = await chatService.getHistory(selectedRoom.room);
        setMessages(history);

        // Tham gia vào phòng chat
        if (socket) {
          socket.emit('join_room', selectedRoom.room);
        }

        // Xóa đánh dấu chưa đọc
        setUnreadRooms((prev) => {
          const next = new Set(prev);
          next.delete(selectedRoom.room);
          return next;
        });
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedRoom, socket]);

  // Gửi tin nhắn
  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedRoom || !socket) return;

    socket.emit('send_message', {
      room: selectedRoom.room,
      content: inputText.trim(),
    });

    // Reset trạng thái gõ phím
    socket.emit('typing', { room: selectedRoom.room, isTyping: false });

    // Cập nhật danh sách phòng ở client cục bộ lập tức
    setRooms((prevRooms) => {
      const idx = prevRooms.findIndex((r) => r.room === selectedRoom.room);
      if (idx > -1) {
        const updated = { ...prevRooms[idx] };
        updated.lastMessage = inputText.trim();
        updated.lastMessageSender = user?.name || 'Staff';
        updated.lastMessageRole = 'staff' as any;
        updated.lastMessageAt = new Date().toISOString();

        const list = [...prevRooms];
        list.splice(idx, 1);
        list.unshift(updated);
        return list;
      }
      return prevRooms;
    });

    setInputText('');
  };

  // Xử lý gửi tin nhắn bằng phím Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Trạng thái gõ phím (typing indicator)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!selectedRoom || !socket) return;

    // Gửi sự kiện gõ phím lên server
    socket.emit('typing', { room: selectedRoom.room, isTyping: true });

    // Tự động tắt trạng thái gõ phím sau 2 giây không nhập tiếp
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { room: selectedRoom.room, isTyping: false });
    }, 2000);
  };

  // Lọc phòng theo tìm kiếm
  const filteredRooms = rooms.filter((r) => {
    const name = r.user?.name || '';
    const email = r.user?.email || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="h-[calc(100vh-140px)] flex rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl">
      {/* ── Left Sidebar: Danh sách khách hàng ── */}
      <div className={`w-80 md:w-96 flex flex-col border-r shrink-0 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        {/* Header tìm kiếm */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Tìm khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border focus:outline-none transition-all ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-white focus:border-akai'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-akai'
              }`}
            />
          </div>
        </div>

        {/* Danh sách các hội thoại */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingRooms ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-akai" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400 dark:text-zinc-500">
              <MessageSquare size={36} className="mb-2 opacity-50" />
              <p className="text-sm font-medium">Không tìm thấy phòng chat nào</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRooms.map((roomItem) => {
                const isSelected = selectedRoom?.room === roomItem.room;
                const isUnread = unreadRooms.has(roomItem.room);
                const userInitials = roomItem.user?.name?.charAt(0)?.toUpperCase() || 'U';

                return (
                  <button
                    key={roomItem.room}
                    onClick={() => setSelectedRoom(roomItem)}
                    className={`w-full p-4 flex items-start gap-3 transition-colors text-left relative ${
                      isSelected
                        ? isDark
                          ? 'bg-zinc-900'
                          : 'bg-zinc-100'
                        : isDark
                        ? 'hover:bg-zinc-900/40'
                        : 'hover:bg-zinc-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {roomItem.user?.avatar ? (
                        <img
                          src={roomItem.user.avatar}
                          alt={roomItem.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-akai to-sakura-dark flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {userInitials}
                        </div>
                      )}
                      {/* Active indicator */}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full" />
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm truncate dark:text-white">
                          {roomItem.user?.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">
                          {new Date(roomItem.lastMessageAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${isUnread ? 'font-bold text-akai' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {roomItem.lastMessageSender === (user?.name || 'Staff') ? (
                          <span className="text-zinc-500 dark:text-zinc-400">Bạn: </span>
                        ) : null}
                        {roomItem.lastMessage}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {isUnread && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-akai rounded-full shadow-lg shadow-akai/50" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Trạng thái kết nối */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-xs font-semibold">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
            {isConnected ? 'Sẵn sàng tiếp nhận hỗ trợ' : 'Ngắt kết nối hỗ trợ'}
          </span>
        </div>
      </div>

      {/* ── Right Content: Khung chat chi tiết ── */}
      <div className={`flex-1 flex flex-col ${isDark ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
        {selectedRoom ? (
          <>
            {/* Header phòng chat */}
            <div className={`p-4 border-b flex items-center justify-between shadow-sm relative z-10 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-akai to-sakura-dark flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {selectedRoom.user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm dark:text-white">{selectedRoom.user?.name}</h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{selectedRoom.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Khung chứa các tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-akai" />
                </div>
              ) : (
                messages.map((message) => {
                  const isStaff = message.senderRole === 'staff' || message.senderRole === 'admin';
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                        isStaff
                          ? 'bg-akai text-white rounded-tr-none'
                          : isDark
                          ? 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700'
                          : 'bg-white text-zinc-800 rounded-tl-none border border-zinc-200'
                      }`}>
                        <div className="font-semibold text-[10px] mb-1 opacity-70">
                          {isStaff ? 'Hỗ trợ viên' : message.senderName}
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <div className="text-[9px] mt-1 text-right opacity-60">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isUserTyping && (
                <div className="flex justify-start">
                  <div className={`rounded-2xl px-4 py-3 rounded-tl-none flex items-center gap-1.5 ${
                    isDark ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-white text-zinc-500 border border-zinc-200'
                  }`}>
                    <span className="text-xs italic font-medium">Khách hàng đang soạn tin</span>
                    <span className="flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input gửi tin nhắn */}
            <div className={`p-4 border-t ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn hỗ trợ..."
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none transition-all text-sm font-medium ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-white focus:border-akai placeholder-zinc-600'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-akai placeholder-zinc-400'
                  }`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="px-5 bg-akai text-white rounded-lg font-bold text-xs hover:bg-sakura-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg shadow-akai/20 hover:shadow-xl shrink-0"
                >
                  <span>Gửi</span>
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-akai/10 to-sakura-dark/10 rounded-2xl flex items-center justify-center text-akai mb-4 shadow-inner">
              <Sparkles size={36} className="animate-pulse" />
            </div>
            <h3 className="font-bold text-lg dark:text-white mb-1">Cổng hỗ trợ khách hàng thời gian thực</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-sm">
              Chọn một cuộc hội thoại từ danh sách bên trái để kết nối và bắt đầu giải đáp thắc mắc của khách hàng ngay lập tức.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
