# Hotel Management System Backend

Production-ready Hotel Management API built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Room management
- Booking system
- Payment processing (Razorpay)
- Admin dashboard
- Email notifications
- Image storage (Cloudinary)
- Role-based access control

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`

## Running the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get single room
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

## Technology Stack

- Express.js 4.x
- MongoDB + Mongoose
- JWT Authentication
- Razorpay Integration
- Cloudinary Integration
- Nodemailer

## Environment Variables Required

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
