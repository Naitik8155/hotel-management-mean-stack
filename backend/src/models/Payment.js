const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Please provide booking ID'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user ID'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide payment amount'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe', 'wallet', 'cod'],
      required: [true, 'Please select a payment method'],
    },
    paymentGatewayId: String,
    orderId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionDetails: {
      transactionId: String,
      signature: String,
      response: mongoose.Schema.Types.Mixed,
    },
    refundDetails: {
      refundId: String,
      refundAmount: Number,
      refundReason: String,
      refundDate: Date,
    },
    invoiceNumber: String,
    description: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
