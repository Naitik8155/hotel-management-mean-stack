const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Room = require('../models/Room');
const User = require('../models/User');

// Get dashboard analytics
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    const query = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Get total bookings
    const totalBookings = await Booking.countDocuments(query);

    // Get confirmed bookings
    const confirmedBookings = await Booking.countDocuments({
      ...query,
      bookingStatus: 'confirmed'
    });

    // Get completed bookings
    const completedBookings = await Booking.countDocuments({
      ...query,
      bookingStatus: 'checked-out'
    });

    // Get cancelled bookings
    const cancelledBookings = await Booking.countDocuments({
      ...query,
      bookingStatus: 'cancelled'
    });

    // Get total revenue
    const revenueResult = await Payment.aggregate([
      { $match: { ...query, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get total users
    const totalUsers = await User.countDocuments();

    // Get total rooms
    const totalRooms = await Room.countDocuments();

    // Get occupied rooms
    const occupiedRooms = await Booking.countDocuments({
      bookingStatus: { $in: ['confirmed', 'checked-in'] },
      checkInDate: { $lte: new Date() },
      checkOutDate: { $gte: new Date() }
    });

    // Get revenue by month (last 12 months)
    const revenueByMonth = await Payment.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    // Get booking status distribution
    const bookingStatusDistribution = await Booking.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get room type popularity
    const roomTypePopularity = await Booking.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'roomId',
          foreignField: '_id',
          as: 'room'
        }
      },
      {
        $unwind: '$room'
      },
      {
        $group: {
          _id: '$room.roomType',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get average booking value
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Get occupancy rate
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalBookings,
          confirmedBookings,
          completedBookings,
          cancelledBookings,
          totalRevenue,
          totalUsers,
          totalRooms,
          occupiedRooms,
          occupancyRate,
          avgBookingValue: avgBookingValue.toFixed(2)
        },
        charts: {
          revenueByMonth,
          bookingStatusDistribution,
          roomTypePopularity
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch analytics'
    });
  }
};

// Get booking analytics
exports.getBookingAnalytics = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'year') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    // Bookings trend
    const bookingsTrend = await Booking.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Bookings by source (assume a source field exists, otherwise default)
    const bookingsBySource = await Booking.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average stay duration
    const avgStayDuration = await Booking.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $project: {
          duration: {
            $divide: [
              { $subtract: ['$checkOutDate', '$checkInDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookingsTrend,
        bookingsBySource: bookingsBySource.length > 0 ? bookingsBySource : [{ _id: 'Direct', count: 0 }],
        avgStayDuration: avgStayDuration.length > 0 ? avgStayDuration[0].avgDuration.toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Booking analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch booking analytics'
    });
  }
};

// Get payment analytics
exports.getPaymentAnalytics = async (req, res, next) => {
  try {
    // Payment status distribution
    const paymentStatusDistribution = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Payment method distribution
    const paymentMethodDistribution = await Payment.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Daily revenue
    const dailyRevenue = await Payment.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $limit: 30
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        paymentStatusDistribution,
        paymentMethodDistribution,
        dailyRevenue
      }
    });
  } catch (error) {
    console.error('Payment analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment analytics'
    });
  }
};

// Get occupancy analytics
exports.getOccupancyAnalytics = async (req, res, next) => {
  try {
    const { month } = req.query;

    // Get all rooms
    const allRooms = await Room.find();
    const totalRooms = allRooms.length;

    // Get bookings for the month
    const startOfMonth = new Date(month || new Date());
    startOfMonth.setDate(1);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const bookings = await Booking.find({
      checkInDate: { $lt: endOfMonth },
      checkOutDate: { $gt: startOfMonth }
    });

    // Calculate occupancy by date
    const occupancyByDate = {};
    const currentDate = new Date(startOfMonth);

    while (currentDate < endOfMonth) {
      const dateStr = currentDate.toISOString().split('T')[0];
      let occupiedCount = 0;

      bookings.forEach(booking => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        
        if (checkIn <= currentDate && checkOut > currentDate) {
          occupiedCount++;
        }
      });

      occupancyByDate[dateStr] = {
        occupied: occupiedCount,
        available: totalRooms - occupiedCount,
        occupancyRate: ((occupiedCount / totalRooms) * 100).toFixed(2)
      };

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get room-wise occupancy
    const roomOccupancy = await Promise.all(
      allRooms.map(async (room) => {
        const occupiedDays = bookings.filter(booking => {
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          
          return booking.roomId.toString() === room._id.toString() &&
            checkIn >= startOfMonth &&
            checkOut <= endOfMonth;
        }).length;

        return {
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          occupiedDays,
          availableDays: new Date(endOfMonth).getDate() - occupiedDays,
          occupancyRate: (((occupiedDays / new Date(endOfMonth).getDate()) * 100)).toFixed(2)
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalRooms,
        month: startOfMonth.toISOString().split('T')[0],
        occupancyByDate,
        roomOccupancy
      }
    });
  } catch (error) {
    console.error('Occupancy analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch occupancy analytics'
    });
  }
};
