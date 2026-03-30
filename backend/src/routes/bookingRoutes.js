const express = require('express');
const {
  createBooking,
  getUserBookings,
  getAllBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  payAtHotel,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/user/my-bookings', protect, getUserBookings);
router.get('/:id', protect, getBooking);
router.post('/:id/cancel', protect, cancelBooking);
router.post('/:id/pay-at-hotel', protect, payAtHotel);

// Admin only
router.get('/', protect, authorize('admin'), getAllBookings);
router.put('/:id', protect, authorize('admin'), updateBookingStatus);

module.exports = router;
