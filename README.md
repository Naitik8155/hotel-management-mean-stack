# Hotel Management System

Complete production-ready Hotel Management System built with MEAN Stack.

## 📁 Project Structure

```
Hotel Management/
├── backend/          # Node.js + Express API
├── frontend/         # Angular Application
└── docs/            # Documentation
```

## 🚀 Quick Start

### Backend Setup

1. Navigate to backend:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with configuration (use `.env.example` as template)

4. Start the server:
   ```bash
   npm run dev
   ```

Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

App will open at `http://localhost:4200`

## 🔐 Default Credentials

Admin accounts are created via the registration system. No default credentials are provided for security.

## ✨ Features

### User Features
- Register and login with JWT authentication
- Browse available rooms with filters
- Make hotel reservations
- View and manage bookings
- Process payments via Razorpay
- Download booking invoices
- Update profile information

### Admin Features
- Dashboard with key metrics
- Room management (CRUD)
- Booking management
- User management
- Payment tracking
- Revenue reports
- Occupancy analytics
- Hotel configuration

### Staff Features
- View check-ins and check-outs
- Manage guest activities
- Update booking statuses

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms` - Create room (Admin)
- `PUT /api/rooms/:id` - Update room (Admin)
- `DELETE /api/rooms/:id` - Delete room (Admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user/my-bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings` - Get all bookings (Admin)
- `PUT /api/bookings/:id` - Update booking status (Admin)

### Payments
- `POST /api/payments/create` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments` - Get all payments (Admin)
- `POST /api/payments/:id/refund` - Process refund (Admin)

### Admin
- `GET /api/admin/stats/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/hotel/details` - Get hotel details
- `PUT /api/admin/hotel/details` - Update hotel details
- `GET /api/admin/reports/revenue` - Revenue report
- `GET /api/admin/reports/occupancy` - Occupancy report

## 🗄️ Database Models

### User
- Personal information
- Authentication credentials
- Role-based access
- Email verification
- Password reset tokens

### Room
- Room details and pricing
- Amenities and capacity
- Availability status
- Images (Cloudinary)

### Booking
- Guest and room information
- Check-in/check-out dates
- Booking status
- Payment information
- Extra services

### Payment
- Payment method and amount
- Transaction details
- Refund tracking
- Invoice generation

### Hotel
- Hotel configuration
- Policies and rules
- Check-in/out times
- Tax and service charges

## 🔒 Security Features

- JWT token-based authentication
- Role-based access control
- Password hashing with bcrypt
- Email verification
- Secure password reset flow
- CORS protection
- HTTP-only cookies

## 📦 Technology Stack

**Frontend:**
- Angular 16
- Bootstrap 5
- TypeScript
- RxJS
- Angular Material (optional)

**Backend:**
- Node.js
- Express.js
- MongoDB
- Mongoose ODM
- JWT Authentication
- Razorpay Integration
- Cloudinary Integration
- Nodemailer

**DevOps:**
- Environment variables
- MongoDB Atlas
- Cloudinary
- Razorpay Sandbox/Production

## 📝 Environment Variables Required

### Backend (.env)
```
MONGODB_URI
PORT
NODE_ENV
JWT_SECRET
JWT_EXPIRE
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
EMAIL_FROM
CLOUDINARY_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
FRONTEND_URL
ADMIN_EMAIL
```

## 🚀 Deployment

### Backend Deployment (Render/Railway)
1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build:prod`
2. Deploy dist folder to Vercel/Netlify

## 📄 Documentation

See individual README files in `backend/` and `frontend/` directories for detailed information.

## 🤝 Contributing

This is a college project implementation. Feel free to extend and customize according to requirements.

## 📧 Support

For issues and questions, refer to the documentation in the respective directories.

---

**Built for Production | No Dummy Data | Fully Admin-Driven**
