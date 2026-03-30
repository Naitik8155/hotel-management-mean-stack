const express = require('express');
const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getHotelDetails,
  updateHotelDetails,
  getRevenueReport,
  getOccupancyReport,
  deleteUser,
} = require('../controllers/adminController');
const {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/staffAdminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin authorization
router.use(protect, authorize('admin'));

router.get('/stats/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Staff Management
router.get('/staff', getAllStaff);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);

router.get('/hotel/details', getHotelDetails);
router.put('/hotel/details', updateHotelDetails);
router.get('/reports/revenue', getRevenueReport);
router.get('/reports/occupancy', getOccupancyReport);

module.exports = router;
