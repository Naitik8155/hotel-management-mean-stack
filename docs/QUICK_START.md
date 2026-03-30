# Hotel Management System - Quick Start Checklist

## ✅ Pre-Installation Checklist

### System Requirements
- [ ] Node.js v14+ installed
- [ ] npm v6+ or yarn installed
- [ ] MongoDB account (Atlas or local)
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

### External Services Setup
- [ ] MongoDB Atlas account created
- [ ] Gmail account with 2FA enabled
- [ ] Cloudinary account created
- [ ] Razorpay account created (test mode)

---

## 📥 Installation Steps (5 minutes)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
# (Use ENVIRONMENT_SETUP.md guide)

# Start backend server
npm run dev
```

✅ **Expected Output:**
```
Server running on port 5000
MongoDB Connected: xxxxx
```

### 2. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Start frontend
npm start
```

✅ **Expected Output:**
```
⠋ Building...
✔ Compiled successfully
Application bundle generated successfully
```

Frontend will automatically open at `http://localhost:4200`

---

## 🧪 Testing the Application

### 1. User Registration
- [ ] Navigate to `/auth/register`
- [ ] Fill in details (name, email, phone, password)
- [ ] Click Register
- [ ] Should redirect to rooms page

### 2. User Login
- [ ] Go to `/auth/login`
- [ ] Enter registered email and password
- [ ] Login should succeed
- [ ] Navbar should show "My Bookings" and "Logout"

### 3. Browse Rooms
- [ ] Go to `/rooms`
- [ ] See list of rooms (if admin added any)
- [ ] Try filters (room type, price range)
- [ ] Click on a room to see details

### 4. Create Booking
- [ ] Click on room
- [ ] Click "Book Room" button
- [ ] Fill in guest details and dates
- [ ] Click "Confirm Booking"
- [ ] Should see success message

### 5. View Bookings
- [ ] Click "My Bookings" in navbar
- [ ] Should see all your bookings
- [ ] Click on a booking to see details

### 6. Admin Panel
- [ ] Need to make user admin first:
  - Register an account
  - In MongoDB, update: `db.users.updateOne({email:"your@email.com"}, {$set:{role:"admin"}})`
- [ ] Navigate to `/admin`
- [ ] Should see dashboard with stats
- [ ] Check links: Rooms, Users, Bookings, Settings

---

## 🔧 Configuration Verification

After setup, verify these are working:

### MongoDB Connection
```bash
# In backend terminal, check for:
# "MongoDB Connected: [host]"
```

### JWT Authentication
```bash
# Register new user and check for:
# "token" in response
```

### Email Service
```bash
# Test password reset functionality
# Check inbox for reset email
```

### Image Upload (Optional)
```bash
# Admin: Try adding room with image
# Should upload to Cloudinary successfully
```

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot find module 'express'"
**Solution:** 
```bash
cd backend
npm install
```

### Issue: "MongoDB connection failed"
**Solution:**
1. Check MONGODB_URI in .env
2. Verify IP whitelist in MongoDB Atlas
3. Check if database name exists

### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Kill process on port 5000 or change PORT in .env
```

### Issue: "CORS error on frontend"
**Solution:**
- Verify FRONTEND_URL in backend .env matches your frontend URL
- Check if both servers are running

### Issue: "Email not sending"
**Solution:**
1. Verify Gmail app password (16 characters)
2. Check if 2FA is enabled on Gmail
3. Look for security alerts from Google

---

## 📊 Database Initialization

After first login, create initial data:

### 1. Create Hotel Details
```bash
# Admin panel → Settings
# Fill in hotel information
```

### 2. Add Rooms
```bash
# Admin panel → Rooms → Add Room
# Create at least 3-4 rooms with different types
```

### 3. Add Staff (Optional)
```bash
# Admin panel → Users
# Create staff accounts and change their role
```

---

## 📱 Testing on Mobile

To test frontend on mobile device:

### Option 1: Using Local Network
```bash
# In frontend terminal, note the local IP
# http://192.168.x.x:4200

# On mobile, visit that address
# Update API URL in services if needed
```

### Option 2: Using ngrok
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 4200

# Use the public URL provided
```

---

## 🚀 Next Steps

### Week 1: Core Testing
- [ ] Test all user flows
- [ ] Verify admin panel
- [ ] Test with multiple users
- [ ] Check error handling

### Week 2: Integration Testing
- [ ] Complete payment flow (Razorpay)
- [ ] Email notifications
- [ ] Image uploads (Cloudinary)
- [ ] Reports and analytics

### Week 3: Optimization & Security
- [ ] Add input validation
- [ ] Implement rate limiting
- [ ] Add logging
- [ ] Performance optimization
- [ ] Security audit

### Week 4: Deployment Preparation
- [ ] Set up production environment variables
- [ ] Test with production databases
- [ ] Prepare deployment checklist
- [ ] Set up CI/CD pipeline

---

## 📚 Documentation Links

- [Backend API Docs](../backend/README.md)
- [Frontend Docs](../frontend/README.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Environment Setup](./ENVIRONMENT_SETUP.md)

---

## 🎯 Feature Implementation Roadmap

### Phase 1: Core (✅ Complete)
- User authentication
- Room browsing
- Booking creation
- Admin dashboard

### Phase 2: Payments (🟡 Ready)
- Razorpay integration
- Payment verification
- Refund processing

### Phase 3: Enhanced Features (⏳ Ready to implement)
- Email notifications
- Image optimization
- Advanced analytics
- SMS notifications
- WhatsApp integration

### Phase 4: Optimization (⏳ Ready to implement)
- Database indexing
- Caching strategy
- Load testing
- Security hardening

---

## 💡 Tips for Success

1. **Keep terminals organized**: Use VS Code terminal splits or separate windows
2. **Monitor logs**: Watch backend console for errors
3. **Test incrementally**: Don't test everything at once
4. **Use Postman**: Test APIs independently of frontend
5. **Check browser console**: Debug frontend issues
6. **Database inspection**: Use MongoDB Compass for easier database viewing
7. **Version control**: Commit frequently and write good messages

---

## ✨ Project Completion Verification

After all tests pass, your project is complete if:

- [x] Backend API running on port 5000
- [x] Frontend app running on port 4200
- [x] User registration works
- [x] Login with JWT token works
- [x] Room browsing works with filters
- [x] Booking creation works
- [x] Admin can see dashboard
- [x] Admin can manage rooms
- [x] Admin can manage users
- [x] Email configuration tested
- [x] No console errors in frontend
- [x] No errors in backend logs

---

## 🆘 Getting Help

1. Check error messages carefully
2. Search docs for keywords
3. Check browser DevTools (F12)
4. Check terminal/console logs
5. Verify environment variables
6. Test with Postman
7. Review MongoDB data

---

## 📝 Notes

**Project Start Date:** January 2026
**Architecture:** MEAN Stack (MongoDB, Express, Angular, Node)
**Status:** Production-Ready
**No Dummy Data:** 100% Admin-driven

---

**Ready to get started? Follow the Installation Steps above!** 🚀
