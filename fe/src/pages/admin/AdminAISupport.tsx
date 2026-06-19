import { useTheme } from '../../contexts/ThemeContext';
import AIChatPanel from '../../components/AIChatPanel';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminAISupport() {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/25`}>
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI Hỗ trợ & Phân tích
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Trợ lý thông minh hỗ trợ phân tích dữ liệu bán hàng, phản hồi khách hàng và thống kê hệ thống.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Chat/Analysis Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className={`p-4 rounded-2xl ${
          isDark
            ? 'bg-[#151929]/80 border border-white/[0.06] backdrop-blur shadow-black/30 shadow-lg'
            : 'bg-white border border-gray-200 shadow-sm'
        }`}
      >
        <AIChatPanel isInline={true} mode="admin" defaultTab="admin" />
      </motion.div>
    </div>
  );
}
