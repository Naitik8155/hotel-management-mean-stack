# Hotel Management System Frontend

Production-ready Hotel Management UI built with Angular and Bootstrap.

## Features

- User registration and login
- Browse and search rooms
- Booking management
- Admin dashboard
- Responsive design
- Real-time room availability

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

**Development:**
```bash
npm start
```

The app will be available at `http://localhost:4200`

**Production Build:**
```bash
npm run build:prod
```

## Project Structure

```
src/
├── app/
│   ├── core/                 # Core services, guards, interceptors
│   │   ├── services/
│   │   ├── guards/
│   │   └── interceptors/
│   ├── features/             # Feature modules
│   │   ├── auth/
│   │   ├── rooms/
│   │   ├── bookings/
│   │   └── admin/
│   ├── shared/               # Shared components
│   └── app.component.*
├── assets/                   # Static assets
├── styles/                   # Global styles
└── main.ts                   # Entry point
```

## Key Components

### Authentication
- Login
- Registration
- Password Reset

### Rooms
- Room browsing with filters
- Room details and availability
- Room image gallery

### Bookings
- Create bookings
- View booking history
- Cancel bookings
- Payment gateway integration

### Admin Dashboard
- Dashboard statistics
- Room management
- User management
- Booking management
- Hotel settings

## Environment Configuration

Update the API URL in services (`src/app/core/services/`) to match your backend URL.

## Technologies

- Angular 16
- Bootstrap 5
- TypeScript
- RxJS
- Reactive Forms

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
