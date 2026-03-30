const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendEmail, generatePaymentConfirmationEmail } = require('../utils/emailService');
const { generateInvoicePDF } = require('../utils/pdfService');

// Initialize Razorpay only if credentials are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✓ Razorpay initialized successfully');
  } catch (error) {
    console.error('✗ Razorpay initialization failed:', error.message);
  }
} else {
  console.warn('⚠ Razorpay credentials not found in .env file');
}

// Create payment order
exports.createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    console.log('Creating payment order for booking:', bookingId);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    const booking = await Booking.findById(bookingId).populate('roomId', 'roomNumber roomType pricePerNight');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log('Booking found:', {
      id: booking._id,
      totalAmount: booking.totalAmount,
      bookingNumber: booking.bookingNumber
    });

    // Validate Razorpay credentials
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured. Please contact admin.'
      });
    }

    // Generate unique receipt ID
    const receiptId = booking.bookingNumber || `BK${booking._id.toString().slice(-8)}`;

    // Ensure amount is valid
    const amountInPaise = Math.round(Number(booking.totalAmount) * 100);

    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking amount'
      });
    }

    const options = {
      amount: amountInPaise, // Amount in paise
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1,
    };

    console.log('Creating Razorpay order with options:', JSON.stringify(options, null, 2));
    let order;
    try {
      order = await razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', order.id);
    } catch (razorError) {
      console.error('Razorpay API error details:', {
        code: razorError.statusCode || 'N/A',
        description: razorError.description || razorError.message || 'Unknown Razorpay error',
        metadata: razorError.metadata || 'None'
      });
      throw razorError;
    }

    console.log('Razorpay order created:', order.id);

    const payment = new Payment({
      bookingId,
      userId: req.user._id,
      amount: booking.totalAmount,
      currency: 'INR',
      paymentMethod: 'razorpay',
      orderId: order.id,
      status: 'pending',
    });

    await payment.save();

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment._id,
        orderId: order.id,
        amount: booking.totalAmount,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID,
        booking: {
          bookingId: booking.bookingNumber || booking._id,
          room: booking.roomId,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          guestDetails: booking.guestDetails,
          numberOfGuests: booking.numberOfGuests,
          specialRequests: booking.specialRequests,
          totalPrice: booking.totalAmount,
        },
      },
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Verify payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    // Verify signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      // Update payment as failed
      if (paymentId) {
        await Payment.findByIdAndUpdate(paymentId, {
          status: 'failed',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }

    // Update payment status
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'completed',
        'transactionDetails.transactionId': razorpayPaymentId,
        'transactionDetails.signature': razorpaySignature,
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    // Update booking payment status and status
    const booking = await Booking.findByIdAndUpdate(
      payment.bookingId,
      {
        paymentStatus: 'completed',
        bookingStatus: 'confirmed'
      },
      { new: true }
    ).populate('roomId', 'roomNumber roomType');

    // Send payment confirmation email
    try {
      const emailContent = generatePaymentConfirmationEmail(payment, booking.guestDetails.firstName);
      await sendEmail(booking.guestDetails.email, 'Payment Confirmation - Booking Confirmed', emailContent);
    } catch (emailError) {
      console.log('Payment confirmation email sending failed:', emailError.message);
      // Continue even if email fails
    }

    // Generate invoice automatically (idempotent)
    try {
      // If an invoice already exists for this booking, skip generation
      const existing = await Invoice.findOne({ bookingId: payment.bookingId });
      if (existing) {
        console.log('Invoice already exists for booking, skipping generation:', existing.invoiceNumber);
      } else {
        const pdfResult = await generateInvoicePDF(booking, payment);

        const invoiceData = {
          bookingId: payment.bookingId,
          userId: payment.userId,
          invoiceNumber: pdfResult.invoiceNumber,
          amount: booking.totalAmount,
          filename: pdfResult.filename,
          status: 'generated'
        };

        try {
          // Atomic upsert keyed by invoiceNumber to avoid E11000 on concurrent requests
          await Invoice.findOneAndUpdate(
            { invoiceNumber: pdfResult.invoiceNumber },
            { $setOnInsert: invoiceData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (dbErr) {
          if (dbErr && dbErr.code === 11000) {
            // another process inserted concurrently — that's fine
            console.log('Concurrent invoice creation detected, using existing record');
          } else {
            throw dbErr;
          }
        }
      }
    } catch (invoiceError) {
      console.log('Invoice generation failed:', invoiceError.message);
      // Continue even if invoice generation fails
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        payment,
        booking,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
};

// Get payment details
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId')
      .populate('userId', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all payments (Admin)
exports.getAllPayments = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;

    let filter = {};

    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('bookingId', 'bookingNumber totalAmount guestDetails')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Process refund
exports.processRefund = async (req, res, next) => {
  try {
    const paymentId = req.params.id; // Get from URL parameter
    const { refundAmount, refundReason } = req.body;

    console.log('Processing refund for payment:', paymentId);

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    // Check if razorpay is available
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured'
      });
    }

    try {
      // Use the amount from payment if refundAmount not provided
      const amountToRefund = refundAmount || payment.amount;

      // Attempt to find a valid transaction ID from multiple possible locations
      const transactionId =
        payment.transactionDetails?.transactionId ||
        payment.paymentGatewayId ||
        payment.orderId;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message: 'No valid transaction reference found for this payment'
        });
      }

      console.log(`Initiating Razorpay refund for transaction: ${transactionId}, Amount: ${amountToRefund}`);

      const refund = await razorpay.payments.refund(transactionId, {
        amount: Math.round(amountToRefund * 100), // Amount in paise
        notes: {
          reason: refundReason || 'Refund requested by admin',
          paymentId: payment._id.toString()
        },
      });

      payment.status = 'refunded';
      payment.refundDetails = {
        refundId: refund.id,
        refundAmount: amountToRefund,
        refundReason: refundReason || 'Refund requested by admin',
        refundDate: new Date(),
      };

      await payment.save();

      // Update booking status as well
      await Booking.findByIdAndUpdate(payment.bookingId, {
        paymentStatus: 'refunded',
        bookingStatus: 'cancelled' // Optional: cancellation usually accompanies refund
      });

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: refund,
      });
    } catch (error) {
      console.error('Razorpay refund API error:', error);
      res.status(500).json({
        success: false,
        message: 'Gateway Rejection: ' + (error.description || error.message || 'Unknown error during reversal')
      });
    }
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
