# JC-Ticket — Full Project Analysis

## Tech Stack Overview

| Layer | Technology |
|-------|-----------|
| **Monorepo** | npm workspaces + `concurrently` |
| **Frontend** | React 19, TypeScript, Vite 8 |
| **FE Styling** | TailwindCSS v3 + PostCSS |
| **FE State** | React Context API (no Redux) |
| **FE Routing** | React Router DOM v7 |
| **FE HTTP** | Axios (with `withCredentials` for httpOnly cookies) |
| **FE i18n** | i18next + react-i18next + browser language detector |
| **FE Animation** | Framer Motion |
| **FE Icons** | Lucide React |
| **FE PDF/QR** | jsPDF, html2canvas, qrcode.react |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | MongoDB Atlas via Mongoose |
| **Auth** | JWT stored in httpOnly cookies (bcrypt passwords) |
| **Payments** | VNPay, ZaloPay |
| **Email** | Nodemailer (OTP delivery) |
| **File Upload** | Multer + Cloudinary |
| **Security** | Helmet, CORS, express-rate-limit |
| **Validation** | Zod |

---

## Project Structure

```
jc-ticket/
├── be/                         Backend (Express + MongoDB)
│   └── src/
│       ├── server.ts           Entry point, Express setup, MongoDB connect
│       ├── config/             Environment loader
│       ├── controllers/        Business logic
│       ├── middleware/         Auth guard, rate limiter, error handler
│       ├── models/             Mongoose schemas
│       ├── routes/             API route definitions
│       ├── services/           3rd-party integrations (payment etc.)
│       └── utils/              Helpers (QR, email, etc.)
└── fe/                         Frontend (React + Vite)
    └── src/
        ├── App.tsx             Router config + providers
        ├── main.tsx            Entry point
        ├── contexts/           Global state (Auth, Theme, Modal)
        ├── components/         Reusable UI components
        ├── pages/              Route-level page components
        │   └── admin/          Admin panel pages
        ├── services/           Axios API call wrappers
        └── i18n/               Translation config
```

---

## Frontend Routes (App.tsx)

| Path | Component | Access |
|------|-----------|--------|
| `/` | `HomePage` | Public |
| `/events` | `EventsPage` | Public |
| `/events/:id` | `EventDetailPage` | Public |
| `/checkout/:bookingId` | `CheckoutPage` | Auth required (implicit) |
| `/payment/result` | `PaymentResultPage` | Public (VNPay/ZaloPay redirect) |
| `/my-tickets` | `MyTicketsPage` | Auth required |
| `/my-tickets/:ticketCode` | `TicketDetailPage` | Auth required |
| `/admin` | `AdminLayout` > `AdminDashboard` | Admin only |
| `/admin/orders` | `AdminOrders` | Admin only |
| `/admin/tickets` | `AdminTickets` | Admin only |
| `/admin/events` | `AdminEvents` | Admin only |

---

## Backend API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register + send OTP (rate: 3/hr) |
| POST | `/verify-otp` | ❌ | Verify registration OTP (rate: 10/15min) |
| POST | `/login` | ❌ | Login → sets httpOnly cookie (rate: 5/15min) |
| POST | `/forgot-password` | ❌ | Send password reset OTP (rate: 3/hr) |
| POST | `/verify-reset-otp` | ❌ | Verify reset OTP |
| POST | `/reset-password` | ❌ | Reset password |
| POST | `/logout` | ✅ | Clear auth cookie |
| GET | `/me` | ✅ | Get current user profile |

### Events — `/api/events`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | List events (filter: category, search, status, page, limit) |
| GET | `/:id` | ❌ | Get event detail |
| POST | `/` | 🔒 Admin | Create event |
| PUT | `/:id` | 🔒 Admin | Update event |
| DELETE | `/:id` | 🔒 Admin | Delete event |

### Bookings — `/api/bookings`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create booking |
| GET | `/my` | ✅ | Get my bookings |
| GET | `/stats` | 🔒 Admin | Booking statistics |
| GET | `/:id` | ✅ | Get booking by ID |
| PATCH | `/:id/cancel` | ✅ | Cancel booking |
| GET | `/` | 🔒 Admin | Get all bookings |
| PATCH | `/:id/payment/admin-confirm` | 🔒 Admin | Admin confirm payment |
| PATCH | `/:id/confirm` | 🔒 Admin | Admin confirm booking |

### Tickets — `/api/tickets`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/verify/:ticketCode` | ❌ | Verify ticket (QR scan, public) |
| GET | `/my` | ✅ | Get my tickets |
| GET | `/code/:ticketCode` | ✅ | Get ticket by code |
| GET | `/` | 🔒 Admin | Get all tickets |
| PATCH | `/:ticketCode/use` | 🔒 Admin | Mark ticket as used |

### Payment — `/api/payment`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/vnpay/create` | ✅ | Create VNPay payment order |
| GET | `/vnpay/return` | ❌ | VNPay redirect callback (after payment) |
| GET | `/vnpay/ipn` | ❌ | VNPay IPN webhook |
| POST | `/vnpay/ipn` | ❌ | VNPay IPN webhook (POST support) |
| GET | `/vnpay/ipn/ping` | ❌ | Health check for ngrok IPN |
| POST | `/zalopay/create` | ✅ | Create ZaloPay order |
| POST | `/zalopay/callback` | ❌ | ZaloPay webhook |
| GET | `/zalopay/status/:appTransId` | ✅ | Check ZaloPay status |
| POST | `/process` | ✅ | Fallback payment (wallet/bank) |
| POST | `/verify` | ✅ | Verify payment |
| POST | `/refund` | ✅ | Refund payment |

### Upload — `/api`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| (varies) | `/upload/...` | likely 🔒 | Multer + Cloudinary image upload |

---

## Frontend ↔ Backend Service Mapping

| FE Service File | Methods | Calls to BE |
|----------------|---------|------------|
| [api.ts](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/fe/src/services/api.ts) | axios base instance | `withCredentials`, 401 interceptor |
| [authService.ts](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/fe/src/services/authService.ts) | register, verifyOTP, login, logout, forgotPassword, verifyResetOTP, resetPassword, getCurrentUser | `/api/auth/*` |
| [eventService.ts](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/fe/src/services/eventService.ts) | getEvents, getEventById, createEvent, updateEvent, deleteEvent | `/api/events/*` |
| [bookingService.ts](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/fe/src/services/bookingService.ts) | createBooking, getMyBookings, getBookingById, getAllBookings, confirmBooking, cancelBooking, getStats | `/api/bookings/*` |
| [ticketService.ts](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/fe/src/services/ticketService.ts) | getMyTickets, getTicketByCode, verifyTicket, getAllTickets, markUsed | `/api/tickets/*` |
| [paymentService.ts](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/fe/src/services/paymentService.ts) | createVNPayOrder, createZaloPayOrder, checkZaloPayStatus, processPayment, verifyPayment | `/api/payment/*` |

---

## Key User Flows

### 🔐 Registration Flow
```
AuthForm (Register tab)
  → authService.register()         POST /api/auth/register
  → OTPInput component              (OTP sent via email)
  → authService.verifyOTP()        POST /api/auth/verify-otp
  → authService.login() (auto)     POST /api/auth/login
  → UserAuthContext.setUser()       (cookie set, state updated)
```

### 🔑 Login Flow
```
AuthModal / AuthForm (Login tab)
  → UserAuthContext.login()
  → authService.login()            POST /api/auth/login
  → Backend sets httpOnly cookie
  → UserAuthContext.setUser()
```

### 🎫 Ticket Purchase Flow
```
EventsPage → click → EventDetailPage
  → eventService.getEventById()    GET /api/events/:id
  → (select ticket type/qty)
  → bookingService.createBooking() POST /api/bookings
  → redirect → CheckoutPage /checkout/:bookingId
  → bookingService.getBookingById() GET /api/bookings/:id
  → (choose payment method)
    ├─ VNPay → paymentService.createVNPayOrder() POST /api/payment/vnpay/create
    │          → redirect to VNPay gateway
    │          → VNPay redirects to /payment/result (GET /api/payment/vnpay/return)
    └─ ZaloPay → paymentService.createZaloPayOrder() POST /api/payment/zalopay/create
                → redirect or QR scan
                → webhook POST /api/payment/zalopay/callback
```

### 🎟️ My Tickets Flow
```
MyTicketsPage
  → ticketService.getMyTickets()   GET /api/tickets/my
  → click ticket → TicketDetailPage /my-tickets/:ticketCode
  → ticketService.getTicketByCode() GET /api/tickets/code/:ticketCode
  → Display QR code (qrcode.react)
  → Download PDF (jsPDF + html2canvas)
```

### 🔑 Password Reset Flow
```
AuthForm (ForgotPassword tab)
  → authService.forgotPassword()   POST /api/auth/forgot-password
  → OTPInput component
  → authService.verifyResetOTP()   POST /api/auth/verify-reset-otp
  → (new password input)
  → authService.resetPassword()    POST /api/auth/reset-password
  → auto-redirect to login
```

### 🛡️ Admin Flow
```
/admin (AdminLayout - sidebar nav)
  ├─ AdminDashboard  → bookingService.getStats()    GET /api/bookings/stats
  ├─ AdminEvents     → eventService.getEvents()     GET /api/events
  │                  → eventService.createEvent()   POST /api/events
  │                  → eventService.updateEvent()   PUT /api/events/:id
  │                  → eventService.deleteEvent()   DELETE /api/events/:id
  ├─ AdminOrders     → bookingService.getAllBookings() GET /api/bookings
  │                  → bookingService.confirmBooking() PATCH /api/bookings/:id/confirm
  └─ AdminTickets    → ticketService.getAllTickets() GET /api/tickets
                     → ticketService.markUsed()     PATCH /api/tickets/:code/use
```

---

## Global State (React Contexts)

| Context | File | Provides |
|---------|------|---------|
| `UserAuthContext` | [UserAuthContext.tsx](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/fe/src/contexts/UserAuthContext.tsx) | `user`, `isAuthenticated`, `isLoading`, `login`, `logout`, `register`, `autoLogin`, `restoreSession` |
| `AuthModalContext` | [AuthModalContext.tsx](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/fe/src/contexts/AuthModalContext.tsx) | Controls auth modal open/close state |
| `ThemeContext` | [ThemeContext.tsx](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/fe/src/contexts/ThemeContext.tsx) | `isDark`, `toggleTheme` |

---

## DB Models (Mongoose)

| Model | File | Key Fields |
|-------|------|-----------|
| `User` | [User.ts](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/be/src/models/User.ts) | name, email, phone, password, role, isVerified, avatar, OTP fields |
| `Event` | [Event.ts](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/be/src/models/Event.ts) | title, description, date, location, category, ticketTypes, image, status |
| `Booking` | [Booking.ts](file:///c:/Users/Acs%20Toan/Documents/EXE/jc-ticket/be/src/models/Booking.ts) | user, event, tickets, totalAmount, paymentStatus, status, passengerInfo |
| `Ticket` | [Ticket.ts](file:///c:/Users/Acs%20Toan/Documents/EXE\jc-ticket\be\src\models\Ticket.ts) | booking, event, user, ticketCode, qrCode, isUsed, ticketType |

---

## Notable Observations & Gotchas

> [!NOTE]
> **Cookie-based Auth**: The FE uses `withCredentials: true` on all Axios requests. Session is managed entirely via httpOnly cookies — no localStorage tokens.

> [!WARNING]
> **Dual Axios Instances**: `authService.ts` creates its own axios instance pointing to `VITE_API_URL/auth`. All other services use the shared `api.ts` instance pointing to `VITE_API_URL` (without `/api` suffix). This means `bookingService`, `eventService`, etc. manually prefix `/api/` in each call path.

> [!NOTE]
> **Auth Guards**: `RequireAuth.tsx` and `ProtectedButton.tsx` components exist for route/action protection. Admin routes currently rely on server-side `adminOnly` middleware — no dedicated FE route guard for admin pages is visible in `App.tsx`.

> [!NOTE]
> **i18n**: The app is fully internationalized via `i18next` with browser language detection. Translation files are in `fe/src/i18n/`.

> [!NOTE]
> **QR Ticket Verification**: The `/api/tickets/verify/:ticketCode` endpoint is **public** (no auth), allowing event staff to scan QR codes without logging in.
