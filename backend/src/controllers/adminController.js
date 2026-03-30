const User = require('../models/User');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Hotel = require('../models/Hotel');

// Get dashboard stats (Admin)
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Total bookings
    const totalBookings = await Booking.countDocuments();

    // Total revenue
    const payments = await Payment.find({ status: 'completed' });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Monthly revenue
    const currentMonth = new Date();
    currentMonth.setDate(1);

    const monthlyRevenue = payments
      .filter((payment) => new Date(payment.createdAt) >= currentMonth)
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Occupancy rate
    const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
    const totalRooms = await Room.countDocuments();
    const occupancyRate = totalRooms ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0;

    // Total users
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Pending bookings
    const pendingBookings = await Booking.countDocuments({ bookingStatus: 'pending' });

    // Failed payments
    const failedPayments = await Payment.countDocuments({ status: 'failed' });

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        totalRevenue,
        monthlyRevenue,
        occupancyRate,
        totalUsers,
        pendingBookings,
        failedPayments,
        totalRooms,
        occupiedRooms,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manage users (Admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive } = req.query;

    let filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user status
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User status updated',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Validate role
    const validRoles = ['user', 'staff', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user, staff, or admin'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete user (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    // Check if trying to delete self
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get hotel details
exports.getHotelDetails = async (req, res, next) => {
  try {
    let hotel = await Hotel.findOne();

    if (!hotel) {
      hotel = await Hotel.create({
        name: 'My Hotel',
        description: 'Hotel description',
        address: {},
      });
    }

    res.status(200).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update hotel details (Admin)
exports.updateHotelDetails = async (req, res, next) => {
  try {
    const hotelData = req.body;

    let hotel = await Hotel.findOne();

    if (!hotel) {
      hotel = await Hotel.create(hotelData);
    } else {
      Object.assign(hotel, hotelData);
      await hotel.save();
    }

    res.status(200).json({
      success: true,
      message: 'Hotel details updated',
      data: hotel,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get revenue report
exports.getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let filter = { status: 'completed' };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('bookingId', 'roomId checkInDate checkOutDate numberOfNights')
      .sort({ createdAt: -1 });

    const dailyRevenue = {};

    payments.forEach((payment) => {
      const date = new Date(payment.createdAt).toISOString().split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      dailyRevenue[date] += payment.amount;
    });

    res.status(200).json({
      success: true,
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      transactionCount: payments.length,
      dailyRevenue,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get occupancy report
exports.getOccupancyReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let filter = { bookingStatus: { $in: ['checked-in', 'checked-out'] } };

    if (startDate || endDate) {
      filter.checkInDate = {};
      if (startDate) filter.checkInDate.$gte = new Date(startDate);
      if (endDate) filter.checkInDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .populate('roomId', 'roomNumber roomType floor')
      .sort({ checkInDate: 1 });

    const totalRooms = await Room.countDocuments();
    const occupiedNights = bookings.reduce((sum, booking) => sum + booking.numberOfNights, 0);
    const totalNights = totalRooms * 30; // Assuming 30 days
    const occupancyPercentage = ((occupiedNights / totalNights) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      totalRooms,
      occupiedNights,
      occupancyPercentage,
      bookingCount: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
