# 🧪 JC-Ticket Authentication - Quick Testing Guide

> Follow these steps to test the authentication system

## ✅ Registration Flow Test

### Step 1: Start the app
```bash
cd fe
npm run dev
# Opens: http://localhost:5173
```

### Step 2: Click Register
- Click the **"Register"** button (top right)
- AuthModal opens with RegisterModal

### Step 3: Fill registration form
```
Name: Test User
Email: test@example.com
Password: Password123!
Confirm Password: Password123!
```

### Step 4: Click Register button
- ✅ Should see toast: **"📧 OTP sent to your email!"**
- Modal switches to **VerifyOTPModal**

### Step 5: Get OTP code
**Option A: Check Backend Response**
1. Open DevTools → Network tab
2. Find `POST /api/auth/register` request
3. Look at response → should have OTP code (for testing)

**Option B: Check Email**
- Check the email account for OTP code

### Step 6: Enter OTP
- Copy 6-digit OTP into the input fields
- After 6 digits entered, auto-verify happens OR click "Verify"

### Step 7: Verify success
- ✅ Modal should close automatically
- ✅ Toast shows: **"🎉 Registration successful! Welcome to JC-Ticket."**
- ✅ **Navbar should show user avatar** instead of Login/Register buttons
- ✅ Click avatar → Dropdown menu appears (Profile, My Tickets, Logout)
- ✅ You are now **logged in**

---

## ✅ Login Flow Test

### Step 1: Click Logout (if logged in)
- Click avatar → Click "Logout"
- ✅ Toast: "👋 Logged out successfully!"
- Navbar shows Login/Register buttons

### Step 2: Click Login button
- Click "Login" button
- AuthModal opens with LoginModal

### Step 3: Enter credentials
```
Email: test@example.com
Password: Password123!
```

### Step 4: Click Login
- ✅ Modal closes automatically
- ✅ Toast shows: **"🎉 Login successful! Welcome back."**
- ✅ Navbar shows user avatar

---

## ✅ Session Persistence Test

### Step 1: Login (if not already)
- Follow login flow above

### Step 2: Refresh page
- Press **F5** or **Ctrl+R**

### Step 3: Verify session
- ✅ User should **still be logged in**
- ✅ Navbar should show **user avatar**
- ✅ User data loaded automatically

### Step 4: Close and reopen browser
- Close browser completely
- Reopen and go to http://localhost:5173

### Step 5: Verify session
- ✅ User should **still be logged in** (if within 7 days)
- ✅ Session restored from httpOnly cookie

---

## ✅ Logout Flow Test

### Step 1: Click avatar dropdown
- Click user avatar in navbar
- Dropdown menu appears

### Step 2: Click Logout
- Click "Logout"

### Step 3: Verify logout
- ✅ Toast shows: **"👋 Logged out successfully!"**
- ✅ Navbar updates to show Login/Register buttons
- ✅ You are logged out

---

## ✅ Protected Button Test

### Step 1: While logged out
- Go to home page → Events section
- Find event card with "Book Now" button
- **Button should be disabled** (grayed out)
- Hover shows tooltip: "Please log in to access this feature"

### Step 2: Click "Book Now" while logged out
- Click the button
- ✅ **Login modal opens automatically**
- ✅ Lock icon visible on button

### Step 3: Login
- Login with your credentials
- ✅ Modal closes

### Step 4: Try "Book Now" again
- Now button is **enabled** (full color)
- ✅ Click → Should work normally

---

## ✅ Error Handling Test

### Test Invalid Credentials
1. Click Login
2. Enter:
   ```
   Email: wrong@email.com
   Password: wrongpassword
   ```
3. Click Login
4. ✅ See error message in modal
5. ✅ See error toast (red) at top

### Test OTP Expiration
1. Register and go to OTP screen
2. Wait 10+ minutes
3. Try entering OTP
4. ✅ See error toast: "OTP expired"

### Test Password Mismatch
1. Click Register
2. Enter passwords that don't match
3. Click Register
4. ✅ See error: "Passwords do not match"

---

## 🔍 Browser DevTools Verification

### Check Cookies
1. Open DevTools → Application → Cookies
2. Find `localhost:5173`
3. Look for auth token cookie
4. ✅ **httpOnly: ✓ (checked)**
5. ✅ **Secure: ✓ (checked in HTTPS)**
6. ✅ **SameSite: Strict**

### Check Network
1. Open DevTools → Network tab
2. Clear network log (trash icon)
3. Click Login
4. Watch network requests:
   - ✅ `POST /api/auth/login` → 200 OK
   - ✅ Request includes `Cookie` header
   - ✅ Response has user data

### Check Console
1. Open DevTools → Console
2. Should see NO errors related to:
   - ❌ Authentication
   - ❌ CORS
   - ❌ Toast

---

## 📱 Mobile Testing

### Test on Mobile
1. Open Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. Select iPhone/Android
3. Test all flows above on mobile view
4. ✅ Responsive design should work
5. ✅ User menu should be accessible
6. ✅ Toasts should display correctly

---

## 🎨 Dark Mode Testing

### Toggle Dark Mode
1. Click moon/sun icon in navbar
2. Test registration/login in dark mode
3. ✅ All colors should work
4. ✅ Text readable
5. ✅ Buttons visible

---

## 🌍 Multi-language Testing

### Switch Language
1. Click globe icon in navbar
2. Select Vietnamese (VI) or English (EN)
3. Test authentication modals
4. ✅ All text should be translated

---

## 📊 Complete Checklist

### Registration
- [ ] Click Register
- [ ] Fill form with valid data
- [ ] Click Register button
- [ ] See "📧 OTP sent" toast
- [ ] Enter OTP
- [ ] Modal closes
- [ ] See "🎉 Registration successful" toast
- [ ] Navbar shows user avatar
- [ ] User menu appears

### Login
- [ ] Click Login
- [ ] Enter credentials
- [ ] Click Login
- [ ] Modal closes
- [ ] See "🎉 Login successful" toast
- [ ] Navbar shows user avatar

### Session Persistence
- [ ] Login
- [ ] Refresh page
- [ ] Still logged in
- [ ] Navbar shows user avatar
- [ ] Close browser and reopen
- [ ] Still logged in

### Logout
- [ ] Click avatar
- [ ] Click Logout
- [ ] See logout toast
- [ ] Navbar shows Login/Register

### Protected Button
- [ ] Logout
- [ ] Button is disabled
- [ ] Click button → Login modal opens
- [ ] Login
- [ ] Button is enabled
- [ ] Click button → Works normally

### Error Handling
- [ ] Try invalid login
- [ ] See error toast
- [ ] Try invalid OTP
- [ ] See error message

### UI/UX
- [ ] Toasts appear at top-center
- [ ] Animations are smooth
- [ ] Loading spinners work
- [ ] Dark mode works
- [ ] Mobile view works
- [ ] Text is readable

---

## 🐛 Troubleshooting

### Problem: Toasts not showing
**Solution:**
- Check if `<Toaster />` is in main.tsx
- Verify react-hot-toast is installed: `npm ls react-hot-toast`

### Problem: Modal doesn't close after OTP
**Solution:**
- Check browser console for errors
- Verify auto-login is working: Check Network tab for login API call
- Check if closeModal() is being called

### Problem: Navbar not updating after login
**Solution:**
- Check if `useUserAuth` hook is in Navbar
- Verify UserAuthProvider wraps App in App.tsx
- Check browser console for errors

### Problem: Session not persisting
**Solution:**
- Check cookies: DevTools → Application → Cookies
- Verify httpOnly cookie exists
- Check if `/api/auth/me` endpoint is working

### Problem: Logout doesn't work
**Solution:**
- Check browser console for errors
- Verify `/api/auth/logout` endpoint is called
- Check if user state is cleared in context

---

## 📞 Need Help?

1. Check browser console for errors
2. Check Network tab for API responses
3. Check cookies in Application tab
4. Verify all files were updated correctly
5. Clear browser cache: Ctrl+Shift+Delete

---

## ✨ All Working?

If all tests pass, you have successfully:
- ✅ Fixed modal OTP flow with auto-login
- ✅ Added toast notifications
- ✅ Updated navbar in realtime
- ✅ Implemented session persistence
- ✅ Protected booking buttons
- ✅ Handled errors gracefully

🎉 **Authentication system is production-ready!**
