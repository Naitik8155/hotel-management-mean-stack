const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');

// Helper to format booking for frontend
const formatBooking = (b) => {
    const booking = b.toObject();
    booking.user = booking.userId;
    booking.room = booking.roomId;
    return booking;
};

// --- Dashboard & Stats ---

exports.getStaffStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const stats = {
            todayCheckIns: await Booking.countDocuments({
                checkInDate: { $gte: today, $lt: tomorrow },
                bookingStatus: { $in: ['confirmed', 'pending'] }
            }),
            todayCheckOuts: await Booking.countDocuments({
                checkOutDate: { $gte: today, $lt: tomorrow },
                bookingStatus: 'checked-in'
            }),
            availableRooms: await Room.countDocuments({ isAvailable: true }),
            occupiedRooms: await Room.countDocuments({ status: 'occupied' }),
            totalGuests: await Booking.aggregate([
                { $match: { bookingStatus: 'checked-in' } },
                { $group: { _id: null, total: { $sum: '$numberOfGuests' } } }
            ]).then(res => res[0]?.total || 0)
        };

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTodayCheckIns = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const bookings = await Booking.find({
            checkInDate: { $gte: today, $lt: tomorrow },
            bookingStatus: { $in: ['confirmed', 'pending', 'checked-in'] }
        }).populate('userId', 'name email phone').populate('roomId', 'roomNumber roomType');

        res.status(200).json({ success: true, data: bookings.map(formatBooking) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTodayCheckOuts = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const bookings = await Booking.find({
            checkOutDate: { $gte: today, $lt: tomorrow },
            bookingStatus: 'checked-in'
        }).populate('userId', 'name email phone').populate('roomId', 'roomNumber roomType');

        res.status(200).json({ success: true, data: bookings.map(formatBooking) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getRecentBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(15)
            .populate('userId', 'name email phone')
            .populate('roomId', 'roomNumber roomType');

        res.status(200).json({ success: true, data: bookings.map(formatBooking) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Booking Management ---

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('userId', 'name email phone')
            .populate('roomId', 'roomNumber roomType pricePerNight')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: bookings.map(formatBooking) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.assignRoom = async (req, res) => {
    try {
        const { roomId } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        booking.roomId = roomId;
        await booking.save();

        res.status(200).json({ success: true, message: 'Room assigned successfully', data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        booking.bookingStatus = status;
        if (notes) booking.notes = notes;

        // Logic for room status updates
        if (status === 'checked-in') {
            await Room.findByIdAndUpdate(booking.roomId, { status: 'occupied', isAvailable: false });
        } else if (status === 'checked-out' || status === 'cancelled') {
            // When checking out or cancelling, room becomes available
            await Room.findByIdAndUpdate(booking.roomId, { status: 'available', isAvailable: true });
        }

        await booking.save();
        res.status(200).json({ success: true, message: 'Status updated successfully', data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Guest Management ---

exports.getAllGuests = async (req, res) => {
    try {
        const guests = await User.find({ role: 'user' })
            .select('-password')
            .sort({ createdAt: -1 });

        const guestsWithStats = await Promise.all(guests.map(async (guest) => {
            const bookings = await Booking.find({ userId: guest._id }).sort({ createdAt: -1 });
            const current = bookings.find(b => ['confirmed', 'checked-in'].includes(b.bookingStatus));

            return {
                ...guest.toObject(),
                totalBookings: bookings.length,
                currentBooking: current ? formatBooking(await Booking.findById(current._id).populate('userId', 'name email phone').populate('roomId', 'roomNumber roomType')) : null
            };
        }));

        res.status(200).json({ success: true, data: guestsWithStats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getGuestDetails = async (req, res) => {
    try {
        const guest = await User.findById(req.params.id).select('-password');
        if (!guest) return res.status(404).json({ success: false, message: 'Guest not found' });

        const bookings = await Booking.find({ userId: guest._id })
            .populate('userId', 'name email phone')
            .populate('roomId', 'roomNumber roomType')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { ...guest.toObject(), bookingHistory: bookings.map(formatBooking), totalBookings: bookings.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.verifyGuest = async (req, res) => {
    try {
        const { verified } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { isVerified: verified }, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        res.status(200).json({ success: true, message: 'Guest verification updated', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Room Management ---

exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({ roomNumber: 1 });
        res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
