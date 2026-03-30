const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { sendEmail, generateBookingConfirmationEmail } = require('../utils/emailService');

// Create booking
exports.createBooking = async (req, res, next) => {
  try {
    const {
      roomId,
      room, // Accept both room and roomId from frontend
      checkInDate,
      checkOutDate,
      numberOfGuests,
      guestDetails,
      specialRequests,
      extraServices,
      totalPrice, // Accept totalPrice from frontend
    } = req.body;

    // Use roomId or room field
    const roomIdentifier = roomId || room;

    // Validate room exists
    const roomDoc = await Room.findById(roomIdentifier);
    if (!roomDoc) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room is available
    if (!roomDoc.isAvailable) {
      return res.status(400).json({ message: 'Room is not available' });
    }

    // Calculate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // Check for date overlap with existing confirmed/checked-in bookings
    const overlappingBookings = await Booking.find({
      roomId: roomIdentifier,
      bookingStatus: { $in: ['confirmed', 'checked-in', 'pending'] }, // Include pending to reserve during booking process
      $or: [
        // New booking starts during an existing booking
        { 
          checkInDate: { $lte: checkIn },
          checkOutDate: { $gt: checkIn }
        },
        // New booking ends during an existing booking
        { 
          checkInDate: { $lt: checkOut },
          checkOutDate: { $gte: checkOut }
        },
        // New booking completely contains an existing booking
        { 
          checkInDate: { $gte: checkIn },
          checkOutDate: { $lte: checkOut }
        }
      ]
    });

    if (overlappingBookings.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'This room is already booked for the selected dates. Please choose different dates or another room.',
        overlappingBookings: overlappingBookings.map(b => ({
          checkInDate: b.checkInDate,
          checkOutDate: b.checkOutDate,
          status: b.bookingStatus
        }))
      });
    }

    // Check guest capacity
    if (numberOfGuests > roomDoc.maxGuests) {
      return res.status(400).json({ message: `Room capacity is ${roomDoc.maxGuests} guests` });
    }

    // Calculate number of nights
    const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (numberOfNights <= 0) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Calculate total amount (use frontend totalPrice if provided)
    let totalAmount = totalPrice || (roomDoc.pricePerNight * numberOfNights);

    let servicesTotal = 0;
    if (extraServices && extraServices.length > 0) {
      extraServices.forEach((service) => {
        servicesTotal += service.price * service.quantity;
      });
      totalAmount += servicesTotal;
    }

    // Handle guestDetails format (support both name field and firstName/lastName)
    let formattedGuestDetails = guestDetails;
    if (guestDetails.name && !guestDetails.firstName) {
      const nameParts = guestDetails.name.split(' ');
      formattedGuestDetails = {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || nameParts[0],
        email: guestDetails.email,
        phone: guestDetails.phone,
      };
    }

    const bookingData = {
      userId: req.user._id,
      roomId: roomIdentifier,
      guestDetails: formattedGuestDetails,
      checkInDate,
      checkOutDate,
      numberOfNights,
      numberOfGuests,
      roomPrice: roomDoc.pricePerNight,
      extraServices: extraServices || [],
      totalAmount,
      specialRequests,
      bookingStatus: 'pending',
      paymentStatus: req.body.paymentStatus || 'pending',
    };

    const booking = await Booking.create(bookingData);

    // Send confirmation email
    try {
      const htmlContent = generateBookingConfirmationEmail(booking, formattedGuestDetails.firstName);
      await sendEmail(formattedGuestDetails.email, 'Booking Confirmation', htmlContent);
    } catch (emailError) {
      console.log('Email sending failed:', emailError.message);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user bookings
exports.getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('roomId')
      .populate('userId', 'name email');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings (Admin)
exports.getAllBookings = async (req, res, next) => {
  try {
    const { bookingStatus, paymentStatus, startDate, endDate } = req.query;

    let filter = {};

    if (bookingStatus) filter.bookingStatus = bookingStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      filter.checkInDate = {};
      if (startDate) filter.checkInDate.$gte = new Date(startDate);
      if (endDate) filter.checkInDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: 'userId',
        select: 'name email phone',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'roomId',
        select: 'roomNumber roomType pricePerNight',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Format bookings data to handle missing references
    const formattedBookings = bookings.map(booking => ({
      ...booking,
      guestName: booking.guestDetails?.firstName 
        ? `${booking.guestDetails.firstName} ${booking.guestDetails.lastName || ''}`.trim()
        : (booking.userId?.name || 'N/A'),
      guestEmail: booking.guestDetails?.email || booking.userId?.email || 'N/A',
      guestPhone: booking.guestDetails?.phone || booking.userId?.phone || 'N/A',
      roomNumber: booking.roomId?.roomNumber || 'Not Assigned',
      roomType: booking.roomId?.roomType || 'N/A',
      status: booking.bookingStatus,
      paymentStatus: booking.paymentStatus
    }));

    res.status(200).json({
      success: true,
      count: formattedBookings.length,
      data: formattedBookings,
    });
  } catch (error) {
    console.error('Error in getAllBookings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message 
    });
  }
};

// Get single booking
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('roomId')
      .populate('assignedStaff', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking status (Admin)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { bookingStatus, status, paymentStatus, notes, assignedStaff } = req.body;

    console.log('Updating booking status:', req.params.id, req.body);

    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }

    booking.bookingStatus = bookingStatus || status || booking.bookingStatus;
    booking.paymentStatus = paymentStatus || booking.paymentStatus;
    booking.notes = notes || booking.notes;
    if (assignedStaff) booking.assignedStaff = assignedStaff;

    // Update room status if checked-in
    if (bookingStatus === 'checked-in' && booking.roomId) {
      try {
        const room = await Room.findById(booking.roomId);
        if (room) {
          room.status = 'occupied';
          room.isAvailable = false;
          await room.save();
        }
      } catch (roomError) {
        console.error('Error updating room status:', roomError);
        // Continue even if room update fails
      }
    }

    // Update room status if checked-out
    if (bookingStatus === 'checked-out' && booking.roomId) {
      try {
        const room = await Room.findById(booking.roomId);
        if (room) {
          room.status = 'available';
          room.isAvailable = true;
          await room.save();
        }
      } catch (roomError) {
        console.error('Error updating room status:', roomError);
        // Continue even if room update fails
      }
    }

    booking = await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to update booking'
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res, next) => {
  try {
    const { cancelReason } = req.body;

    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.bookingStatus === 'checked-in' || booking.bookingStatus === 'checked-out') {
      return res.status(400).json({ message: 'Cannot cancel this booking' });
    }

    booking.bookingStatus = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelReason = cancelReason;

    booking = await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payment status to pay-at-hotel
exports.payAtHotel = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: 'pay-at-hotel',
        bookingStatus: 'confirmed',
      },
      { new: true }
    ).populate('roomId', 'roomNumber roomType pricePerNight');

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking confirmed. Payment will be collected at hotel.',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
