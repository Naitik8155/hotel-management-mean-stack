const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: [true, 'Please provide invoice number'],
    },
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
      required: [true, 'Please provide invoice amount'],
    },
    filename: {
      type: String,
      required: [true, 'Please provide filename'],
    },
    status: {
      type: String,
      enum: ['generated', 'sent', 'viewed', 'downloaded'],
      default: 'generated',
    },
    sentAt: Date,
    viewedAt: Date,
    downloadedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
