const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { generateInvoicePDF, getInvoiceFile } = require('../utils/pdfService');
const fs = require('fs');

// Generate invoice for booking
exports.generateInvoice = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('roomId', 'roomNumber roomType pricePerNight floor')
      .populate('userId', 'email name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Find payment
    const payment = await Payment.findOne({ bookingId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Idempotency: if an invoice already exists for this booking, return it (avoid duplicate-key)
    const existingInvoice = await Invoice.findOne({ bookingId });
    if (existingInvoice) {
      return res.status(200).json({
        success: true,
        message: 'Invoice already generated',
        data: {
          invoiceNumber: existingInvoice.invoiceNumber,
          filename: existingInvoice.filename,
          downloadUrl: `/api/invoices/download/${existingInvoice.filename}`
        }
      });
    }

    // Generate PDF (will produce deterministic invoiceNumber for the booking)
    const pdfResult = await generateInvoicePDF(booking, payment);

    // Try to insert atomically — if another request inserted the same invoiceNumber concurrently,
    // return the existing record instead of failing with E11000.
    try {
      const invoiceData = {
        bookingId,
        userId: booking.userId,
        invoiceNumber: pdfResult.invoiceNumber,
        amount: booking.totalAmount,
        filename: pdfResult.filename,
        status: 'generated'
      };

      // Atomic upsert keyed by invoiceNumber prevents duplicate documents on race
      const invoice = await Invoice.findOneAndUpdate(
        { invoiceNumber: pdfResult.invoiceNumber },
        { $setOnInsert: invoiceData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Invoice generated successfully',
        data: {
          invoiceNumber: invoice.invoiceNumber,
          filename: invoice.filename,
          downloadUrl: `/api/invoices/download/${invoice.filename}`
        }
      });
    } catch (err) {
      // If a duplicate-key slipped through, return the existing invoice instead of 500
      if (err && err.code === 11000) {
        const found = await Invoice.findOne({ invoiceNumber: pdfResult.invoiceNumber });
        if (found) {
          return res.status(200).json({
            success: true,
            message: 'Invoice already generated',
            data: {
              invoiceNumber: found.invoiceNumber,
              filename: found.filename,
              downloadUrl: `/api/invoices/download/${found.filename}`
            }
          });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate invoice'
    });
  }
};

// Download invoice
exports.downloadInvoice = async (req, res, next) => {
  try {
    const { filename } = req.params;

    // Validate filename (prevent directory traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    // Get file path
    const filepath = getInvoiceFile(filename);

    // Send file
    res.download(filepath, filename);
  } catch (error) {
    console.error('Invoice download error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download invoice'
    });
  }
};

// Get user invoices
exports.getUserInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id })
      .populate('bookingId', 'bookingNumber checkInDate checkOutDate')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get invoice details
exports.getInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
      .populate('bookingId')
      .populate('userId', 'email name');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
