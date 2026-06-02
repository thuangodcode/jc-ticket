import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Lock,
  Camera,
  Mail,
  Phone,
  ShieldCheck,
  Ticket,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { useUserAuth } from '../contexts/useUserAuth';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { toast } from 'sonner';
import { ticketService } from '../services/ticketService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ProfilePage() {
  const { isDark } = useTheme();
  const { user, isAuthenticated, isLoading, updateProfile, changePassword } = useUserAuth();
  const navigate = useNavigate();

  // Tabs: 'info' | 'security' | 'stats'
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'stats'>('info');

  // Profile Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Avatar Upload State
  const [isUploading, setIsUploading] = useState(false);

  // Stats
  const [ticketCount, setTicketCount] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Vui lòng đăng nhập để xem thông tin hồ sơ.');
      navigate('/');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Load user data into form states
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // Fetch ticket count
  useEffect(() => {
    if (isAuthenticated) {
      ticketService.getMyTickets()
        .then(res => {
          if (res && Array.isArray(res.data)) {
            setTicketCount(res.data.length);
          } else if (Array.isArray(res)) {
            setTicketCount(res.length);
          }
        })
        .catch(err => console.error('Error fetching ticket count for profile page:', err));
    }
  }, [isAuthenticated]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-ink">
        <Loader2 className="w-12 h-12 text-akai animate-spin" />
      </div>
    );
  }

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Họ và tên không được để trống.');
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateProfile(name, phone, avatar);
      toast.success('Hồ sơ của bạn đã được cập nhật thành công!');
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.message || 'Cập nhật hồ sơ thất bại.';
      toast.error(errMsg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Avatar File Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file hình ảnh.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsUploading(true);
      const uploadUrl = `${API_BASE_URL}/api/upload`;
      
      const res = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      if (res.data && res.data.success && res.data.data?.url) {
        const newAvatarUrl = res.data.data.url;
        setAvatar(newAvatarUrl);
        // Automatically save avatar url to profile
        await updateProfile(name, phone, newAvatarUrl);
        toast.success('Đã tải lên và cập nhật ảnh đại diện thành công!');
      } else {
        toast.error('Tải lên ảnh thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.message || 'Lỗi khi tải ảnh đại diện lên server.';
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Change Password
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      toast.error('Vui lòng nhập mật khẩu cũ.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải dài ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp.');
      return;
    }

    try {
      setIsChangingPass(true);
      await changePassword(oldPassword, newPassword);
      toast.success('Mật khẩu đã được đổi thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.message || 'Mật khẩu cũ không chính xác hoặc đổi mật khẩu thất bại.';
      toast.error(errMsg);
    } finally {
      setIsChangingPass(false);
    }
  };

  // Colors & Theme System
  const bgStyle = isDark ? 'bg-ink text-cream' : 'bg-gray-50 text-ink';
  const cardStyle = isDark ? 'bg-charcoal/80 border border-zinc-800 backdrop-blur-md' : 'bg-white border border-gray-200 shadow-sm';
  const inputStyle = isDark 
    ? 'bg-zinc-900 border border-zinc-800 text-cream focus:ring-akai focus:border-akai' 
    : 'bg-white border border-gray-300 text-ink focus:ring-akai focus:border-akai';
  const labelStyle = isDark ? 'text-cream/80' : 'text-charcoal';

  return (
    <div className={`min-h-screen flex flex-col ${bgStyle} transition-colors duration-300`}>
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-24 pb-16">
        
        {/* Cover Japanese Banner Accent */}
        <div className="w-full h-44 md:h-56 rounded-3xl overflow-hidden relative mb-8 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-akai via-sakura-dark to-sakura opacity-95"></div>
          {/* Subtle Japanese patterns or line elements using plain divs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full -ml-20 -mb-20"></div>
          <div className="absolute inset-0 flex items-end p-6 md:p-8 justify-between">
            <div className="text-white z-10">
              <span className="bg-white/20 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm border border-white/20 uppercase tracking-widest">
                Thông tin cá nhân
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold font-elegant mt-2">Hồ sơ cá nhân</h1>
            </div>
            <div className="hidden md:flex items-center space-x-3 text-white/90 z-10 text-sm">
              <span className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-full border border-white/10">
                <ShieldCheck size={16} className="text-green-400" />
                {user.role === 'admin' ? 'Quản trị viên' : user.role === 'staff' ? 'Nhân viên' : 'Thành viên'}
              </span>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / Left Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* User Profile Card */}
            <div className={`${cardStyle} rounded-3xl p-6 flex flex-col items-center text-center shadow-lg relative overflow-hidden`}>
              {/* Decorative top strip */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-akai to-sakura-dark"></div>

              {/* Avatar Uploader Wrapper */}
              <div className="relative group mt-4 mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-akai/30 bg-gradient-to-tr from-akai to-sakura flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{name ? name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>

                {/* Upload Hover Overlay */}
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <input type="file" onChange={handleAvatarChange} className="hidden" accept="image/*" disabled={isUploading} />
                  <Camera size={24} className="text-white mb-1 animate-bounce" />
                  <span className="text-[10px] text-white font-medium uppercase tracking-wider">Cập nhật ảnh</span>
                </label>

                {/* Uploading spinner */}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-full">
                    <Loader2 size={28} className="text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* User Identity Details */}
              <h2 className="text-xl font-bold mb-1 line-clamp-1">{name}</h2>
              <p className={`text-sm mb-4 ${isDark ? 'text-cream/60' : 'text-charcoal/60'} truncate max-w-full w-full px-2`}>
                {user.email}
              </p>

              {/* Badge for Mobile/Role */}
              <div className="md:hidden flex items-center gap-1.5 bg-akai/10 text-akai text-xs font-semibold px-2.5 py-1 rounded-full mb-4">
                <ShieldCheck size={14} />
                {user.role === 'admin' ? 'Quản trị viên' : user.role === 'staff' ? 'Nhân viên' : 'Thành viên'}
              </div>

              {/* Navigation Tabs */}
              <div className="w-full flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'info'
                      ? 'bg-akai text-white shadow-md'
                      : isDark
                      ? 'hover:bg-zinc-800 text-cream/80'
                      : 'hover:bg-gray-100 text-charcoal'
                  }`}
                >
                  <User size={18} />
                  <span>Thông tin cá nhân</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'security'
                      ? 'bg-akai text-white shadow-md'
                      : isDark
                      ? 'hover:bg-zinc-800 text-cream/80'
                      : 'hover:bg-gray-100 text-charcoal'
                  }`}
                >
                  <Lock size={18} />
                  <span>Đổi mật khẩu</span>
                </button>

                <button
                  onClick={() => setActiveTab('stats')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'stats'
                      ? 'bg-akai text-white shadow-md'
                      : isDark
                      ? 'hover:bg-zinc-800 text-cream/80'
                      : 'hover:bg-gray-100 text-charcoal'
                  }`}
                >
                  <Ticket size={18} />
                  <span>Thống kê tài khoản</span>
                </button>
              </div>

            </div>

          </div>

          {/* Right Column / Content Card */}
          <div className="lg:col-span-8">
            <div className={`${cardStyle} rounded-3xl p-6 md:p-8 shadow-lg min-h-[400px]`}>
              
              <AnimatePresence mode="wait">
                
                {/* TAB 1: Profile Details */}
                {activeTab === 'info' && (
                  <motion.div
                    key="tab-info"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-xl font-bold font-elegant mb-2 flex items-center gap-2">
                      <User className="text-akai" /> Thông tin tài khoản
                    </h3>
                    <p className={`text-sm mb-6 ${isDark ? 'text-cream/55' : 'text-charcoal/55'}`}>
                      Cập nhật thông tin chi tiết tài khoản của bạn để nhận vé và cập nhật sự kiện nhanh chóng.
                    </p>

                    <form onSubmit={handleSaveProfile} className="space-y-5">
                      
                      {/* Name input */}
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${labelStyle}`}>Họ và tên</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 pointer-events-none">
                            <User size={16} />
                          </span>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all duration-200 ${inputStyle}`}
                            placeholder="Nhập họ và tên"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone Input */}
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${labelStyle}`}>Số điện thoại</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 pointer-events-none">
                            <Phone size={16} />
                          </span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all duration-200 ${inputStyle}`}
                            placeholder="Nhập số điện thoại"
                          />
                        </div>
                      </div>

                      {/* Email input (Disabled) */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className={`block text-sm font-semibold ${labelStyle}`}>Địa chỉ Email</label>
                          <span className="text-[11px] text-green-500 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Đã xác thực
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 pointer-events-none">
                            <Mail size={16} />
                          </span>
                          <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full pl-10 pr-4 py-3 rounded-xl outline-none bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
                            placeholder="Email"
                          />
                        </div>
                        <p className="text-[11px] mt-1.5 text-zinc-500 dark:text-zinc-400">
                          Địa chỉ email được liên kết trực tiếp với tài khoản và không thể tự ý thay đổi.
                        </p>
                      </div>

                      {/* Submit button */}
                      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="flex items-center gap-2 bg-akai text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-sakura-dark hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50"
                        >
                          {isSavingProfile ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              <span>Đang lưu...</span>
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              <span>Lưu thay đổi</span>
                            </>
                          )}
                        </button>
                      </div>

                    </form>
                  </motion.div>
                )}

                {/* TAB 2: Change Password */}
                {activeTab === 'security' && (
                  <motion.div
                    key="tab-security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-xl font-bold font-elegant mb-2 flex items-center gap-2">
                      <Lock className="text-akai" /> Bảo mật & Đổi mật khẩu
                    </h3>
                    <p className={`text-sm mb-6 ${isDark ? 'text-cream/55' : 'text-charcoal/55'}`}>
                      Thay đổi mật khẩu định kỳ để nâng cao bảo mật cho tài khoản của bạn.
                    </p>

                    <form onSubmit={handleChangePasswordSubmit} className="space-y-5">
                      
                      {/* Old Password */}
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${labelStyle}`}>Mật khẩu cũ</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 pointer-events-none">
                            <Lock size={16} />
                          </span>
                          <input
                            type={showOldPass ? 'text' : 'password'}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className={`w-full pl-10 pr-10 py-3 rounded-xl outline-none transition-all duration-200 ${inputStyle}`}
                            placeholder="Nhập mật khẩu hiện tại"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPass(!showOldPass)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-akai"
                          >
                            {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${labelStyle}`}>Mật khẩu mới</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 pointer-events-none">
                            <Lock size={16} />
                          </span>
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`w-full pl-10 pr-10 py-3 rounded-xl outline-none transition-all duration-200 ${inputStyle}`}
                            placeholder="Độ dài tối thiểu 6 ký tự"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-akai"
                          >
                            {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${labelStyle}`}>Nhập lại mật khẩu mới</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 pointer-events-none">
                            <Lock size={16} />
                          </span>
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full pl-10 pr-10 py-3 rounded-xl outline-none transition-all duration-200 ${inputStyle}`}
                            placeholder="Nhập lại mật khẩu mới để xác nhận"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-akai"
                          >
                            {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                        <button
                          type="submit"
                          disabled={isChangingPass}
                          className="flex items-center gap-2 bg-akai text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-sakura-dark hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50"
                        >
                          {isChangingPass ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              <span>Đang xử lý...</span>
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              <span>Đổi mật khẩu</span>
                            </>
                          )}
                        </button>
                      </div>

                    </form>
                  </motion.div>
                )}

                {/* TAB 3: Account Stats */}
                {activeTab === 'stats' && (
                  <motion.div
                    key="tab-stats"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-bold font-elegant mb-2 flex items-center gap-2">
                        <Ticket className="text-akai" /> Thống kê & Hoạt động
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-cream/55' : 'text-charcoal/55'}`}>
                        Xem tóm tắt các hoạt động và đặt vé của bạn trên hệ thống JC-Ticket.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Ticket Count Card */}
                      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-100'} flex items-center justify-between`}>
                        <div>
                          <p className="text-sm text-zinc-500 font-semibold uppercase tracking-wider mb-1">Vé đã đặt</p>
                          <p className="text-3xl font-extrabold text-akai">{ticketCount} Vé</p>
                        </div>
                        <div className="w-12 h-12 bg-akai/10 rounded-full flex items-center justify-center text-akai">
                          <Ticket size={24} />
                        </div>
                      </div>

                      {/* Role Card */}
                      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-100'} flex items-center justify-between`}>
                        <div>
                          <p className="text-sm text-zinc-500 font-semibold uppercase tracking-wider mb-1">Loại tài khoản</p>
                          <p className="text-2xl font-extrabold capitalize">
                            {user.role === 'admin' ? 'Quản trị viên' : user.role === 'staff' ? 'Nhân viên' : 'Thành viên'}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                          <ShieldCheck size={24} />
                        </div>
                      </div>

                    </div>

                    {/* Quick navigation actions */}
                    <div className={`p-6 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white border-gray-200'} flex flex-col md:flex-row items-center justify-between gap-4`}>
                      <div className="flex items-center gap-3">
                        <AlertCircle className="text-akai hidden sm:block flex-shrink-0" />
                        <div>
                          <p className="font-bold text-sm">Xem và quản lý vé điện tử</p>
                          <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>Tải vé dạng PDF hoặc hiển thị mã QR check-in tại cổng sự kiện.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/my-tickets')}
                        className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-akai text-white font-semibold text-sm hover:bg-sakura-dark transition-all duration-300 text-center"
                      >
                        Đến trang Vé của tôi
                      </button>
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>

            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
