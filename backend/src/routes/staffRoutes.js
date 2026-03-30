const express = require('express');
const {
    getStaffStats,
    getTodayCheckIns,
    getTodayCheckOuts,
    getRecentBookings,
    getAllBookings,
    assignRoom,
    updateStatus,
    getAllGuests,
    getGuestDetails,
    verifyGuest,
    getAllRooms
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All staff routes require staff or admin authorization
router.use(protect, authorize('staff', 'admin'));

// Dashboard Stats
router.get('/stats', getStaffStats);
router.get('/today-checkins', getTodayCheckIns);
router.get('/today-checkouts', getTodayCheckOuts);
router.get('/recent', getRecentBookings);

// Bookings
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/status', updateStatus);
router.put('/bookings/:id/assign-room', assignRoom);

// Guests
router.get('/guests', getAllGuests);
router.get('/guests/:id', getGuestDetails);
router.put('/guests/:id/verify', verifyGuest);

// Rooms
router.get('/rooms', getAllRooms);

module.exports = router;
