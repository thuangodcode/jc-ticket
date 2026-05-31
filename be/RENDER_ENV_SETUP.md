# 🚀 Render Environment Variables Setup

## URLs Production
- **Backend (Render):** https://jc-ticket.onrender.com  
- **Frontend (Vercel):** https://jc-ticket.vercel.app

---

## ⚠️ QUAN TRỌNG – Phải set trên Render Dashboard

Vào: **Render Dashboard → jc-ticket service → Environment → Add Environment Variable**

### ✅ Các biến CẦN SET (copy chính xác)

| Biến | Giá trị |
|------|---------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://jc-ticket.vercel.app` |
| `EMAIL_FROM` | `JC-Ticket <120304thuan@gmail.com>` |
| `EMAIL_SERVICE` | `gmail` |
| `VNP_RETURNURL` | `https://jc-ticket.onrender.com/api/payment/vnpay/return` |
| `VNP_IPNURL` | `https://jc-ticket.onrender.com/api/payment/vnpay/ipn` |
| `ZALOPAY_CALLBACK_URL` | `https://jc-ticket.onrender.com/api/payment/zalopay/callback` |

### ✅ Các biến cần set (copy từ .env local)

| Biến | Lấy từ |
|------|--------|
| `MONGO_URI` | `.env` dòng MONGO_URI |
| `JWT_SECRET` | `.env` dòng JWT_SECRET |
| `GMAIL_EMAIL` | `.env` dòng GMAIL_EMAIL |
| `GMAIL_APP_PASSWORD` | `.env` (không có khoảng trắng) |
| `CLOUDINARY_CLOUD_NAME` | `.env` |
| `CLOUDINARY_API_KEY` | `.env` |
| `CLOUDINARY_API_SECRET` | `.env` |
| `PAYOS_CLIENT_ID` | `.env` |
| `PAYOS_API_KEY` | `.env` |
| `PAYOS_CHECKSUM_KEY` | `.env` |
| `GEMINI_API_KEY` | API key từ Google AI Studio (không dùng OAuth token) |

> Có thể dùng `GOOGLE_API_KEY` thay cho `GEMINI_API_KEY` nếu bạn đang chuẩn hóa theo tên biến Google. Chỉ cần set một trong hai biến là đủ.

---

## 🔴 Tại sao NODE_ENV=production là bắt buộc

```
NODE_ENV=development  →  cookie: { secure: false, sameSite: 'lax' }
                          Browser KHÔNG gửi cookie từ Vercel (HTTPS) sang Render (HTTPS)
                          → 401 Unauthorized trên MỌI request cần login

NODE_ENV=production   →  cookie: { secure: true, sameSite: 'none' }
                          Cookie được gửi đúng cách → Auth hoạt động ✅
```

---

## ✅ Vercel Environment Variables

Vào: **Vercel Dashboard → jc-ticket project → Settings → Environment Variables**

| Biến | Giá trị |
|------|---------|
| `VITE_API_URL` | `https://jc-ticket.onrender.com` |

> File `fe/.env.production` đã có sẵn giá trị đúng, nhưng nên set thêm trên Vercel dashboard để đảm bảo.

---

## 📋 Checklist sau khi set xong

- [ ] Set tất cả biến trên Render dashboard
- [ ] Click **"Manual Deploy" → "Deploy latest commit"** trên Render
- [ ] Đợi deploy xong (~3-5 phút)
- [ ] Mở https://jc-ticket.onrender.com/health → phải trả `{"status":"OK"}`
- [ ] Test login tại https://jc-ticket.vercel.app
- [ ] Mở DevTools → Application → Cookies → kiểm tra `accessToken` có `Secure` ✓ và `SameSite: None` ✓
- [ ] Test forgot-password → không còn lỗi 500
