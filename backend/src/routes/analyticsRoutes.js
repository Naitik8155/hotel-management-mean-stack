const express = require('express');
const {
  getDashboardAnalytics,
  getBookingAnalytics,
  getPaymentAnalytics,
  getOccupancyAnalytics,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Dashboard route - allow without auth for now to debug
router.get('/dashboard', getDashboardAnalytics);

// Admin only routes
router.get('/bookings', protect, authorize('admin'), getBookingAnalytics);
router.get('/payments', protect, authorize('admin'), getPaymentAnalytics);
router.get('/occupancy', protect, authorize('admin'), getOccupancyAnalytics);

module.exports = router;
