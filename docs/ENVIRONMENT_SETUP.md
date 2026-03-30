# Environment Configuration Guide

## Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

### Database
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel_management
```

**Steps to get MongoDB URI:**
1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Go to Database -> Connect -> Copy connection string
4. Replace `<username>` and `<password>` with your credentials
5. Replace `myFirstDatabase` with `hotel_management`

### Server Configuration
```
PORT=5000
NODE_ENV=development
```

### JWT Authentication
```
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Email Configuration (Gmail)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@hotelmanagement.com
```

**Steps to get Gmail App Password:**
1. Enable 2-Factor Authentication on Gmail
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Find "App passwords"
4. Select "Mail" and "Windows Computer"
5. Copy the generated 16-character password

### Cloudinary Configuration
```
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Steps to get Cloudinary Credentials:**
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard
3. Find API Keys section
4. Copy Cloud Name, API Key, and API Secret

### Razorpay Configuration
```
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_test_secret_key
```

**Steps to set up Razorpay:**
1. Create account at [Razorpay](https://razorpay.com/)
2. Go to Settings -> API Keys
3. Copy Key ID and Key Secret (Test mode)
4. For production, switch to Live mode

### Frontend Configuration
```
FRONTEND_URL=http://localhost:4200
```

For production: `https://yourdomain.com`

### Admin Settings
```
ADMIN_EMAIL=admin@hotelmanagement.com
```

---

## Sample .env File

```
# MongoDB Configuration
MONGODB_URI=mongodb+srv://hotel_user:password123@cluster0.mongodb.net/hotel_management

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123
JWT_EXPIRE=7d

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hotelmangement@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
EMAIL_FROM=noreply@hotelmanagement.com

# Cloudinary Configuration
CLOUDINARY_NAME=demo-cloudinary
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123def456ghi789jkl012

# Razorpay Configuration (Test Mode)
RAZORPAY_KEY_ID=rzp_test_1Aa00000000001
RAZORPAY_KEY_SECRET=xyz789abc456def123ghi

# Frontend Configuration
FRONTEND_URL=http://localhost:4200

# Admin Settings
ADMIN_EMAIL=admin@hotelmanagement.com
```

---

## Frontend Configuration

Update API URLs in service files if deploying on different servers:

**File: `src/app/core/services/auth.service.ts`**
```typescript
private API_URL = 'http://localhost:5000/api/auth';
```

Change to your backend URL:
```typescript
private API_URL = 'https://your-backend-domain.com/api/auth';
```

Apply similar changes to all service files:
- `room.service.ts`
- `booking.service.ts`
- `payment.service.ts`
- `admin.service.ts`

---

## Deployment Environment Variables

### For Render/Railway (Backend)

1. Create new Web Service
2. Connect GitHub repository
3. Add Environment Variables:
   - `MONGODB_URI` - Production MongoDB Atlas URI
   - `JWT_SECRET` - Different from development
   - All other variables as listed above
4. Deploy

### For Vercel/Netlify (Frontend)

1. Connect GitHub repository
2. Set Build Command: `npm run build:prod`
3. Set Publish Directory: `dist/hotel-management-frontend`
4. Add Environment Variables (if needed):
   - `API_BASE_URL` - Production backend URL

---

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use strong JWT secret** - Generate with crypto library
3. **Change default values** - All examples above are demo values
4. **Use HTTPS in production** - Especially for authentication
5. **Rotate Razorpay keys** - Regularly in production
6. **Restrict API access** - Use rate limiting in production
7. **Email validation** - Verify email addresses before use
8. **CORS configuration** - Restrict to your frontend domain only

---

## Troubleshooting

### MongoDB Connection Error
- Verify connection string is correct
- Check if IP whitelist includes your machine (MongoDB Atlas)
- Ensure database name exists

### Email Not Sending
- Verify Gmail app password is correct
- Check if 2FA is enabled on Gmail
- Look for security alerts from Gmail

### Cloudinary Upload Failing
- Verify API credentials are correct
- Check image file size (max 100MB)
- Ensure folder path is created in Cloudinary dashboard

### Razorpay Payment Error
- Ensure you're using test credentials for development
- Check if amount is in correct currency (INR, USD, etc.)
- Verify webhook URL is accessible from Razorpay

---

## Local Development Setup

```bash
# Install all dependencies
cd backend && npm install && cd ../frontend && npm install && cd ..

# Create backend .env
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Start both servers (in separate terminals)

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

Both applications should now be running:
- Backend: http://localhost:5000
- Frontend: http://localhost:4200

---

## Test Credentials

### Razorpay Test Card
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

### Test Booking
- Check-in: Tomorrow's date
- Check-out: Day after tomorrow
- Guests: 1-4 (depends on room)

---

For more details, refer to each service's documentation:
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Cloudinary Dashboard](https://cloudinary.com/console)
- [Razorpay Documentation](https://razorpay.com/docs)
