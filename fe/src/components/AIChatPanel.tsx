import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, RotateCcw, Sparkles, ChevronDown, Copy, Check, User, X, ShieldCheck, Ticket, MessageSquare, Loader2, Headphones } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUserAuth } from '../contexts/useUserAuth';
import { aiService } from '../services/aiService';
import type { ChatMessage } from '../services/aiService';
import { useSocket } from '../contexts/SocketContext';
import { chatService } from '../services/chatService';
import { useAuthModal } from '../contexts/AuthModalContext';

const USER_STORAGE_KEY = 'jc_user_ai_history';
const ADMIN_STORAGE_KEY = 'jc_admin_ai_history';
const MAX_USER_HISTORY = 20;
const MAX_ADMIN_HISTORY = 30;

const USER_QUICK_PROMPTS = [
  { icon: '🎵', text: 'Tìm concert âm nhạc' },
  { icon: '🎫', text: 'Xem vé của tôi' },
  { icon: '📦', text: 'Kiểm tra đơn hàng' },
  { icon: '🔥', text: 'Sự kiện nổi bật tuần này' },
];

const ADMIN_QUICK_PROMPTS = [
  { icon: '📊', text: 'Tóm tắt tình hình hôm nay' },
  { icon: '💰', text: 'Tổng doanh thu tháng này là bao nhiêu?' },
  { icon: '🎫', text: 'Sự kiện nào đang bán chạy nhất?' },
  { icon: '🎟️', text: 'Thống kê vé đã sử dụng vs chưa sử dụng' },
];

// ─────────────────────────────────────────────
// Reusable Markdown Renderer (Lists, Tables, Headings, Code)
// ─────────────────────────────────────────────
function RenderMarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const [headerLine, , ...bodyLines] = tableLines;
      const headers = headerLine.split('|').map(s => s.trim()).filter(Boolean);
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-2 rounded-xl border border-current/10 bg-current/[0.02]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-current/10 bg-current/5">
                {headers.map((h, j) => (
                  <th key={j} className="px-3 py-2 text-left font-bold tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyLines.map((row, ri) => {
                const cells = row.split('|').map(s => s.trim()).filter(Boolean);
                return (
                  <tr key={ri} className="border-b border-current/5 hover:bg-current/5 transition-colors">
                    {cells.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 whitespace-nowrap">{renderInline(cell)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<p key={i} className="font-extrabold text-sm mt-3 mb-1 text-purple-400">{line.slice(4)}</p>);
    } else if (line.startsWith('## ')) {
      elements.push(<p key={i} className="font-extrabold mt-3 mb-1 text-purple-400">{line.slice(3)}</p>);
    } else if (line.startsWith('# ')) {
      elements.push(<p key={i} className="font-extrabold text-base mt-3 mb-1 text-purple-400">{line.slice(2)}</p>);
    // List Items
    } else if (line.match(/^[-*•]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 items-start pl-1 mt-0.5">
          <span className="text-purple-500 font-bold mt-0.5">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={i} className="flex gap-2 items-start pl-1 mt-0.5">
            <span className="font-bold text-purple-500 shrink-0">{match[1]}.</span>
            <span>{renderInline(match[2])}</span>
          </div>
        );
      }
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(<p key={i} className="mt-0.5">{renderInline(line)}</p>);
    }
    i++;
  }

  return <div className="space-y-1 text-xs leading-relaxed">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="px-1 py-0.5 rounded text-[11px] bg-current/10 font-mono font-semibold">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// Copy to Clipboard button
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-current/10 absolute top-2 right-2"
      title="Copy câu trả lời"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-current/60" />}
    </button>
  );
}

interface AIChatPanelProps {
  isInline?: boolean;
  mode?: 'user' | 'admin' | 'both';
  defaultTab?: 'user' | 'admin';
  onClose?: () => void;
}

export default function AIChatPanel({ isInline = false, mode = 'both', defaultTab = 'user', onClose }: AIChatPanelProps) {
  const { isDark } = useTheme();
  const { user } = useUserAuth();
  const isAdmin = user?.role === 'admin';
  const allowRoleSwitch = mode === 'both' && isAdmin;
  const initialTab = mode === 'both'
    ? (isAdmin && defaultTab === 'admin' ? 'admin' : 'user')
    : mode;

  const [activeTab, setActiveTab] = useState<'user' | 'admin'>(() => {
    return initialTab;
  });

  const [isOpen, setIsOpen] = useState(false);

  // Separate message histories
  const [userMessages, setUserMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [adminMessages, setAdminMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { socket } = useSocket();
  const { switchModal } = useAuthModal();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live support states
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'support'>('ai');
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [supportInput, setSupportInput] = useState('');
  const [isStaffTyping, setIsStaffTyping] = useState(false);
  const [staffName, setStaffName] = useState('');

  // Lắng nghe sự kiện socket cho live chat (hỗ trợ viên)
  useEffect(() => {
    if (!socket || !user || activeSubTab !== 'support' || activeTab !== 'user') return;

    const loadLiveHistory = async () => {
      try {
        setIsLiveLoading(true);
        const history = await chatService.getHistory(user.id);
        setLiveMessages(history);
        
        // Join room
        socket.emit('join_room', user.id);
      } catch (err) {
        console.error('Failed to load live chat history:', err);
      } finally {
        setIsLiveLoading(false);
      }
    };

    loadLiveHistory();

    const handleReceiveMessage = (message: any) => {
      if (message.room === user.id) {
        setLiveMessages((prev) => [...prev, message]);
        setIsStaffTyping(false);
      }
    };

    const handleUserTyping = (data: { room: string; name: string; role: string; isTyping: boolean }) => {
      if (data.room === user.id && (data.role === 'staff' || data.role === 'admin')) {
        setStaffName(data.name);
        setIsStaffTyping(data.isTyping);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, user, activeSubTab, activeTab]);

  const sendSupportMessage = () => {
    const text = supportInput.trim();
    if (!text || !socket || !user) return;

    socket.emit('send_message', {
      room: user.id,
      content: text,
    });

    socket.emit('typing', { room: user.id, isTyping: false });
    setSupportInput('');
    setTimeout(() => scrollToBottom(), 50);
  };

  const handleSupportInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSupportInput(e.target.value);
    if (!socket || !user) return;

    socket.emit('typing', { room: user.id, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { room: user.id, isTyping: false });
    }, 2000);
  };

  const handleSupportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendSupportMessage();
    }
  };

  // Synchronize history save
  useEffect(() => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userMessages.slice(-MAX_USER_HISTORY)));
    } catch { /* ignore */ }
  }, [userMessages]);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminMessages.slice(-MAX_ADMIN_HISTORY)));
    } catch { /* ignore */ }
  }, [adminMessages]);

  useEffect(() => {
    if (mode !== 'both' && activeTab !== mode) {
      setActiveTab(mode);
    }
  }, [activeTab, mode]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const messages = activeTab === 'user' ? userMessages : adminMessages;
  const setMessages = activeTab === 'user' ? setUserMessages : setAdminMessages;

  useEffect(() => {
    scrollToBottom(false);
  }, [activeTab, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isInline) {
      setTimeout(() => scrollToBottom(false), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isInline, scrollToBottom]);

  const handleScroll = () => {
    const el = chatBodyRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 90);
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = messages.slice(-10);
      let res;
      if (activeTab === 'user') {
        res = await aiService.userChat(msg, historyForApi);
      } else {
        res = await aiService.adminChat(msg, historyForApi);
      }

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: res.reply || 'Xin lỗi, tôi không thể phản hồi lúc này.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      let errorText = '⚠️ Có lỗi xảy ra, vui lòng thử lại.';
      if (status === 429 || serverMsg?.includes('bận')) {
        errorText = '⏳ AI đang bận, vui lòng thử lại sau vài giây!';
      } else if (status === 503) {
        errorText = serverMsg
          ? `🔧 ${serverMsg}`
          : '🔧 Dịch vụ AI chưa được cấu hình. Vui lòng liên hệ admin.';
      } else if (!navigator.onLine) {
        errorText = '📵 Mất kết nối mạng. Vui lòng kiểm tra internet.';
      }

      const aiErrorMsg: ChatMessage = {
        role: 'assistant',
        content: errorText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiErrorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(activeTab === 'user' ? USER_STORAGE_KEY : ADMIN_STORAGE_KEY);
  };

  const isEmpty = messages.length === 0;

  // Card & color tokens
  const cardBg = isDark
    ? 'bg-[#0d111d]/95 border-white/[0.08] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]'
    : 'bg-white/95 border-gray-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]';
  const inputBg = isDark
    ? 'bg-[#060913] border-white/[0.06] focus-within:border-purple-500/50 focus-within:shadow-[0_0_15px_rgba(168,85,247,0.15)]'
    : 'bg-gray-50 border-gray-200/80 focus-within:border-purple-500/40 focus-within:bg-white focus-within:shadow-[0_0_15px_rgba(168,85,247,0.08)]';
  
  // Theme gradients
  const userBubble = 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md shadow-indigo-500/10';
  const aiBubble = isDark
    ? 'bg-white/[0.04] text-gray-100 border border-white/[0.06] shadow-sm'
    : 'bg-gray-50 text-gray-800 border border-gray-200/60 shadow-sm';

  const welcomePrompts = activeTab === 'user' ? USER_QUICK_PROMPTS : ADMIN_QUICK_PROMPTS;
  const panelTitle = activeTab === 'user' ? 'JC Support AI' : 'JC Analysis AI';
  const primaryTabLabel = 'Hỗ trợ người dùng';
  const secondaryTabLabel = 'Phân tích admin';

  // ─────────────────────────────────────────────
  // Core Unified Chat Frame
  // ─────────────────────────────────────────────
  const ChatFrame = (
    <div className={`flex flex-col h-full w-full bg-transparent`}>
      {/* Header & Tabs */}
      <div className={`flex flex-col shrink-0 border-b ${
        isDark ? 'border-white/[0.08] bg-white/[0.01]' : 'border-gray-200/50 bg-gray-50/30'
      }`}>
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Glowing logo */}
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
            activeTab === 'user' 
              ? 'from-indigo-500 via-purple-500 to-pink-500 shadow-purple-500/25' 
              : 'from-violet-500 via-purple-500 to-indigo-500 shadow-violet-500/25'
            } flex items-center justify-center shadow-lg relative`}>
            <Bot size={18} className="text-white relative z-10 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-extrabold tracking-wide uppercase text-purple-400">
              {panelTitle}
            </h3>
            <p className={`text-[10px] flex items-center gap-1.5 mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Đang hoạt động (Gemini)
            </p>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearHistory}
                title="Xóa lịch sử chat"
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <RotateCcw size={14} />
              </motion.button>
            )}
            {!isInline && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X size={15} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Tab switcher (Only shown to Admin users) */}
        {allowRoleSwitch && (
          <div className="px-4 pb-2.5 flex">
            <div className={`p-1 rounded-xl flex gap-1 w-full relative ${
              isDark ? 'bg-black/20' : 'bg-gray-100'
            }`}>
              {/* Tab 1 button */}
              <button
                onClick={() => setActiveTab('user')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg relative z-10 transition-colors duration-300 ${
                  activeTab === 'user' 
                    ? 'text-white' 
                    : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Ticket size={13} />
                {primaryTabLabel}
              </button>

              {/* Tab 2 button */}
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg relative z-10 transition-colors duration-300 ${
                  activeTab === 'admin' 
                    ? 'text-white' 
                    : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <ShieldCheck size={13} />
                {secondaryTabLabel}
              </button>

              {/* Sliding background indicator */}
              <motion.div
                layoutId="activeTabIndicator"
                className={`absolute top-1 bottom-1 rounded-lg bg-gradient-to-tr z-0 ${
                  activeTab === 'user' 
                    ? 'from-indigo-600 via-purple-600 to-pink-600' 
                    : 'from-violet-600 to-indigo-600'
                }`}
                animate={{
                  left: activeTab === 'user' ? '4px' : '50%',
                  right: activeTab === 'user' ? '50%' : '4px',
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Subtab switcher for User chat: AI vs Live Staff support */}
      {activeTab === 'user' && (
        <div className="px-4 pb-2 pt-1 flex border-b border-current/10 shrink-0 bg-inherit">
          <div className={`p-1 rounded-xl flex gap-1 w-full relative ${
            isDark ? 'bg-black/20' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => setActiveSubTab('ai')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeSubTab === 'ai' 
                  ? 'text-white bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 shadow-sm font-semibold' 
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Trợ lý AI
            </button>
            <button
              onClick={() => setActiveSubTab('support')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeSubTab === 'support' 
                  ? 'text-white bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 shadow-sm font-semibold' 
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Hỗ trợ viên
            </button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={chatBodyRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth relative bg-inherit"
        style={{ scrollbarWidth: 'thin' }}
      >
        {activeTab === 'user' && activeSubTab === 'support' ? (
          // ── Live Support Tab Body ──
          !user ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Headphones size={28} className="text-purple-500" />
              </div>
              <h3 className="font-extrabold text-sm mb-1">Trò chuyện với Hỗ trợ viên</h3>
              <p className={`text-xs mb-6 px-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Vui lòng đăng nhập để bắt đầu kết nối trực tiếp với nhân viên hỗ trợ của chúng tôi.
              </p>
              <button
                onClick={() => switchModal('login')}
                className="px-6 py-2.5 bg-gradient-to-tr from-indigo-600 to-pink-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all"
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : isLiveLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-purple-500" />
            </div>
          ) : liveMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center mb-4 animate-pulse">
                <MessageSquare size={28} className="text-purple-500" />
              </div>
              <h3 className="font-extrabold text-sm mb-1">Cổng hỗ trợ trực tiếp 🌸</h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Chào mừng bạn đến với kênh chat trực tuyến với Nhân viên hỗ trợ (Staff). Gửi tin nhắn bên dưới để bắt đầu cuộc trò chuyện.
              </p>
            </div>
          ) : (
            <>
              {liveMessages.map((msg, i) => {
                const isStaff = msg.senderRole === 'staff' || msg.senderRole === 'admin';
                return (
                  <motion.div
                    key={msg._id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2.5 ${!isStaff ? 'flex-row-reverse' : 'flex-row'} group`}
                  >
                    {/* Avatar */}
                    <div className={`w-7.5 h-7.5 rounded-xl shrink-0 flex items-center justify-center text-white shadow-sm
                      ${!isStaff
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
                        : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'
                      }`}>
                      {!isStaff ? <User size={13} /> : <Headphones size={13} />}
                    </div>

                    {/* Bubble */}
                    <div className={`flex-1 max-w-[76%] ${!isStaff ? 'flex justify-end' : ''}`}>
                      <div className={`relative px-3.5 py-2.5 rounded-2xl transition-all
                        ${!isStaff 
                          ? `${userBubble} rounded-tr-sm text-xs` 
                          : `${aiBubble} rounded-tl-sm text-xs`
                        }`}>
                        <div className="font-semibold text-[9px] mb-1 opacity-70">
                          {isStaff ? 'Hỗ trợ viên' : msg.senderName}
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className={`text-[9px] mt-1 px-1 font-medium ${
                        !isStaff ? 'text-right' : 'text-left'
                      } ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing indicator */}
              {isStaffTyping && (
                <div className="flex gap-2.5">
                  <div className={`w-7.5 h-7.5 rounded-xl shrink-0 flex items-center justify-center ${
                    isDark ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <User size={13} className="text-purple-500 animate-pulse" />
                  </div>
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${aiBubble}`}>
                    <span className="text-xs italic font-medium opacity-80">{staffName} đang trả lời...</span>
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          // ── Original AI Chat Body ──
          isEmpty ? (
            /* Welcome state */
            <div className="flex flex-col items-center justify-center h-full text-center px-2 py-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${
                activeTab === 'user' 
                  ? 'from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-purple-500/20' 
                  : 'from-violet-500/10 to-indigo-500/10 border-violet-500/20'
                } border flex items-center justify-center mb-4 relative shadow-inner`}>
                <Sparkles size={28} className={`${activeTab === 'user' ? 'text-purple-500' : 'text-violet-500'} animate-pulse`} />
                <div className="absolute inset-0 rounded-2xl bg-purple-500/5 blur-xl" />
              </div>
              
              <h3 className="font-extrabold text-base mb-1 tracking-tight">
                {activeTab === 'user' ? 'Xin chào quý khách! 👋' : 'Xin chào Admin! 📊'}
              </h3>
              
              <p className={`text-xs mb-6 px-4 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {activeTab === 'user' 
                  ? 'Tôi là JC Assistant, sẵn sàng trợ giúp bạn tìm kiếm sự kiện, xem thông tin vé và tra cứu tình trạng đơn hàng.'
                  : 'Tôi là trợ lý Admin AI chuyên nghiệp. Tôi sẽ giúp bạn phân tích số liệu, tạo báo cáo doanh thu và so sánh sự kiện.'
                }
              </p>

              {/* Quick prompts */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {welcomePrompts.map((p) => (
                  <motion.button
                    key={p.text}
                    whileHover={{ scale: 1.02, translateY: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(p.text)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl text-left text-xs
                      font-semibold transition-all duration-200 border shadow-sm
                      ${isDark
                        ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30 text-gray-300'
                        : 'border-gray-200/70 bg-white hover:bg-purple-50/30 hover:border-purple-200 text-gray-700'
                      }`}
                  >
                    <span className="text-base shrink-0">{p.icon}</span>
                    <span className="leading-snug">{p.text}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages list */
            <>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} group`}
                >
                  {/* Avatar */}
                  <div className={`w-7.5 h-7.5 rounded-xl shrink-0 flex items-center justify-center text-white shadow-sm
                    ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
                      : activeTab === 'user'
                        ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'
                        : 'bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-500 shadow-violet-500/20'
                    }`}>
                    {msg.role === 'user'
                      ? <User size={13} />
                      : <Bot size={13} className="text-white animate-pulse" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`flex-1 max-w-[76%] ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                    <div className={`relative px-3.5 py-2.5 rounded-2xl transition-all
                      ${msg.role === 'user' 
                        ? `${userBubble} rounded-tr-sm text-xs` 
                        : `${aiBubble} rounded-tl-sm`
                      }`}>
                      {msg.role === 'assistant' ? (
                        <>
                          <RenderMarkdownContent text={msg.content} />
                          <CopyBtn text={msg.content} />
                        </>
                      ) : (
                        <span className="text-xs leading-relaxed">{msg.content}</span>
                      )}
                    </div>
                    {msg.timestamp && (
                      <p className={`text-[9px] mt-1 px-1 font-medium ${
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      } ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className={`w-7.5 h-7.5 rounded-xl shrink-0 flex items-center justify-center
                    ${isDark ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-gray-100 border border-gray-200'}`}>
                    <Bot size={13} className="text-purple-500 animate-pulse" />
                  </div>
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${aiBubble}`}>
                    <div className="flex gap-1.5 items-center">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          className={`w-1.5 h-1.5 rounded-full ${activeTab === 'user' ? 'bg-purple-500' : 'bg-violet-500'}`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className={`absolute right-4 bottom-[78px] p-2 rounded-full shadow-lg border backdrop-blur z-10 transition-colors
              ${isDark 
                ? 'bg-[#0d111d] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.04]' 
                : 'bg-white border-gray-200 text-gray-500 hover:text-black hover:bg-gray-50'}`}
          >
            <ChevronDown size={14} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className={`px-3 py-3.5 border-t shrink-0 bg-inherit ${
        isDark ? 'border-white/[0.08]' : 'border-gray-200/50'
      }`}>
        {/* Suggested quick queries after first message */}
        {activeSubTab === 'ai' && !isEmpty && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {welcomePrompts.slice(0, 3).map((q) => (
              <motion.button
                key={q.text}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => sendMessage(q.text)}
                disabled={isLoading}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px]
                  font-semibold transition-all border disabled:opacity-50 shadow-sm
                  ${isDark
                    ? 'border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] text-gray-400 hover:text-white'
                    : 'border-gray-200 hover:bg-gray-100 bg-white text-gray-500 hover:text-black'
                  }`}
              >
                <span>{q.icon}</span>
                <span className="whitespace-nowrap">{q.text}</span>
              </motion.button>
            ))}
          </div>
        )}

        <div className={`flex items-end gap-2 rounded-xl border px-3 py-2.5 transition-all duration-300 ${inputBg}`}>
          <textarea
            ref={inputRef}
            id="unified-ai-chat-input"
            value={activeTab === 'user' && activeSubTab === 'support' ? supportInput : input}
            onChange={activeTab === 'user' && activeSubTab === 'support' ? handleSupportInputChange : (e) => setInput(e.target.value)}
            onKeyDown={activeTab === 'user' && activeSubTab === 'support' ? handleSupportKeyDown : handleKeyDown}
            placeholder={
              activeTab === 'user'
                ? activeSubTab === 'support'
                  ? "Nhắn tin trực tiếp với Hỗ trợ viên..."
                  : "Hỏi tôi về sự kiện, vé, đơn hàng..."
                : "Hỏi về doanh thu, thống kê sự kiện..."
            }
            rows={1}
            disabled={activeTab === 'user' && activeSubTab === 'support' ? (!user || isLiveLoading) : isLoading}
            className={`flex-1 bg-transparent resize-none text-xs outline-none leading-relaxed
              max-h-24 overflow-y-auto placeholder-gray-400 disabled:opacity-50
              ${isDark ? 'text-gray-100' : 'text-gray-800'}`}
            style={{ scrollbarWidth: 'none' }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={activeTab === 'user' && activeSubTab === 'support' ? sendSupportMessage : () => sendMessage()}
            disabled={
              activeTab === 'user' && activeSubTab === 'support'
                ? !supportInput.trim() || !user
                : !input.trim() || isLoading
            }
            id="unified-ai-chat-send"
            className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${
              activeTab === 'user' 
                ? 'from-indigo-500 via-purple-500 to-pink-500 shadow-purple-500/25' 
                : 'from-violet-500 via-purple-500 to-indigo-500 shadow-violet-500/25'
              } flex items-center justify-center text-white shrink-0
              disabled:opacity-40 disabled:cursor-not-allowed transition-opacity
              shadow-sm hover:shadow-purple-500/40`}
          >
            <Send size={13} />
          </motion.button>
        </div>
        <p className={`text-[9px] text-center mt-1.5 font-medium ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          Powered by Google Gemini · Enter để gửi
        </p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // Renders either Inline Container or Floating Modal
  // ─────────────────────────────────────────────
  if (isInline) {
    return (
      <div className={`${cardBg} rounded-2xl overflow-hidden flex flex-col transition-all duration-300 w-full h-[540px]`}>
        {ChatFrame}
      </div>
    );
  }

  return (
    <>
      {/* ── Floating trigger button ── */}
      <motion.button
        id="user-ai-chat-trigger"
        onClick={() => setIsOpen(true)}
        animate={isOpen ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08, rotate: 3 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-2xl
          bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500
          shadow-xl shadow-purple-500/20 flex items-center justify-center
          text-white cursor-pointer group"
        title="Trợ lý AI JC-Ticket"
        aria-label="Mở trợ lý AI"
      >
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-2xl animate-ping bg-purple-500/25 opacity-75" />
        <span className="absolute -inset-[3px] rounded-[18px] border border-white/20 group-hover:border-white/40 transition-colors" />
        <Sparkles size={22} className="relative z-10 drop-shadow animate-pulse" />
      </motion.button>

      {/* ── Chat panel modal ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="user-ai-chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`fixed bottom-6 right-6 z-[9998] w-[385px] max-w-[calc(100vw-1.5rem)]
              rounded-2xl border backdrop-blur-2xl
              flex flex-col overflow-hidden transition-colors duration-300 ${cardBg}`}
            style={{ height: '540px' }}
          >
            {ChatFrame}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
