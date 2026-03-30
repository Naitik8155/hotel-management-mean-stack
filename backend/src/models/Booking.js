const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      uppercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user ID'],
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Please select a room'],
    },
    guestDetails: {
      firstName: {
        type: String,
        required: [true, 'Please provide first name'],
      },
      lastName: {
        type: String,
        required: [true, 'Please provide last name'],
      },
      email: {
        type: String,
        required: [true, 'Please provide email'],
      },
      phone: {
        type: String,
        required: [true, 'Please provide phone number'],
      },
      address: String,
      idProof: String,
    },
    checkInDate: {
      type: Date,
      required: [true, 'Please provide check-in date'],
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Please provide check-out date'],
    },
    numberOfNights: {
      type: Number,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: [true, 'Please provide number of guests'],
    },
    roomPrice: {
      type: Number,
      required: true,
    },
    extraServices: [
      {
        serviceName: String,
        price: Number,
        quantity: Number,
        total: Number,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'pay-at-hotel'],
      default: 'pending',
    },
    specialRequests: String,
    notes: String,
    cancelledAt: Date,
    cancelReason: String,
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Auto-generate booking number
bookingSchema.pre('save', async function (next) {
  if (!this.bookingNumber) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingNumber = `BK${Date.now()}${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
