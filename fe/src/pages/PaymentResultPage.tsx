import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, Ticket } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Navbar } from '../components/Navbar';
import api from '../services/api';
import { paymentService } from '../services/paymentService';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    const check = async () => {
      try {
        const source = searchParams.get('source');
        const redirectStatus = searchParams.get('status');
        if (source === 'vnpay' && redirectStatus !== null) {
          setStatus(redirectStatus === '1' ? 'success' : 'failed');
          return;
        }

        const vnpCode = searchParams.get('vnp_ResponseCode');
        if (vnpCode) {
          const res = await api.get('/api/payment/vnpay/return', { params: Object.fromEntries(searchParams.entries()) });
          setStatus(res.data.success && vnpCode === '00' ? 'success' : 'failed');
          return;
        }
        const zpAppTransId = searchParams.get('apptransid') || searchParams.get('appTransId');
        if (zpAppTransId) {
          const res = await paymentService.checkZaloPayStatus(zpAppTransId);
          const zpData = res.data;
          const isPaid = zpData?.return_code === 1 || zpData?.zp_trans_status === 1 || zpData?.zp_trans_status === '1';
          setStatus(isPaid ? 'success' : 'failed');
          return;
        }
        const zpStatus = searchParams.get('status');
        if (zpStatus === '1' || zpStatus === 'success') { setStatus('success'); }
        else { setStatus('failed'); }
      } catch { setStatus('failed'); }
    };
    check();
  }, [searchParams]);

  const bg = isDark ? 'bg-ink text-cream' : 'bg-gray-50 text-ink';
  const card = isDark ? 'bg-charcoal border border-zinc-800' : 'bg-white border border-gray-200';

  return (
    <div className={`min-h-screen ${bg}`}>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen pt-16 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`max-w-md w-full p-8 rounded-3xl text-center ${card} shadow-2xl`}>
          {status === 'loading' ? (
            <><div className="w-20 h-20 mx-auto mb-6 border-4 border-akai border-t-transparent rounded-full animate-spin" /><h2 className="text-xl font-bold">Đang xác nhận...</h2></>
          ) : status === 'success' ? (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="w-24 h-24 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"><CheckCircle size={48} className="text-white" /></motion.div>
              <h2 className="text-2xl font-bold mb-2 text-green-500">Thanh toán thành công! 🎉</h2>
              <p className={`text-sm mb-6 ${isDark ? 'text-cream/70' : 'text-charcoal/70'}`}>Vé đã được tạo và gửi đến email của bạn.</p>
              <div className="flex justify-center gap-2 mb-6">{['🎊','🎉','✨','🎫','🌸'].map((e,i)=>(<motion.span key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5+i*0.1}} className="text-2xl">{e}</motion.span>))}</div>
              <button onClick={()=>navigate('/my-tickets')} className="w-full py-3.5 bg-akai text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sakura-dark shadow-lg shadow-akai/30"><Ticket size={18}/>Xem vé của tôi</button>
              <button onClick={()=>navigate('/events')} className={`w-full py-3 mt-3 rounded-xl text-sm ${isDark?'text-cream/70 hover:bg-midnight':'text-charcoal/70 hover:bg-cream'}`}>Tiếp tục khám phá <ArrowRight size={14} className="inline"/></button>
            </>
          ) : (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg"><XCircle size={48} className="text-white" /></motion.div>
              <h2 className="text-2xl font-bold mb-2 text-red-500">Thanh toán thất bại</h2>
              <p className={`text-sm mb-6 ${isDark?'text-cream/70':'text-charcoal/70'}`}>Vui lòng thử lại hoặc chọn phương thức khác.</p>
              <button onClick={()=>navigate(-1)} className="w-full py-3.5 bg-akai text-white rounded-xl font-bold hover:bg-sakura-dark">Thử lại</button>
              <button onClick={()=>navigate('/events')} className={`w-full py-3 mt-3 rounded-xl text-sm ${isDark?'text-cream/70':'text-charcoal/70'}`}>Quay về</button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
