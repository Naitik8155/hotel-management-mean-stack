// No-DB test for invoiceController.generateInvoice idempotency
// Usage: node tmp/invoice_controller_idempotency_test.js

const path = require('path');
const controller = require('../src/controllers/invoiceController');
const InvoiceModel = require('../src/models/Invoice');

// Stub Booking and Payment (the controller imports them internally)
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');

// Minimal stubs
// emulate Mongoose Query + populate chaining
Booking.findById = (id) => ({
  populate: function() {
    // support chained populate().populate()
    return { populate: async () => ({
      _id: id,
      bookingNumber: 'BKTEST123',
      totalAmount: 1234,
      roomId: { roomType: 'Deluxe', roomNumber: '101' },
      userId: 'USERID',
      checkInDate: Date.now(),
      checkOutDate: Date.now() + 86400000,
      guestDetails: { firstName: 'Test', lastName: 'User', email: 't@example.com' }
    }) };
  }
});

Payment.findOne = async (q) => ({
  bookingId: q.bookingId,
  paymentMethod: 'razorpay',
  createdAt: new Date().toISOString(),
  transactionDetails: { transactionId: 'TXN_TEST' }
});

// Capture what would be saved
let createdInvoice = null;
InvoiceModel.findOne = async (q) => {
  if (createdInvoice && (q.bookingId && q.bookingId == createdInvoice.bookingId || q.invoiceNumber && q.invoiceNumber == createdInvoice.invoiceNumber)) {
    return createdInvoice;
  }
  return null;
};

InvoiceModel.findOneAndUpdate = async (filter, update, opts) => {
  // simulate upsert: if exists return it, otherwise create and return new
  if (createdInvoice && createdInvoice.invoiceNumber === filter.invoiceNumber) return createdInvoice;
  const doc = Object.assign({}, update.$setOnInsert || {}, { _id: 'INV_DOC_ID' });
  createdInvoice = doc;
  return createdInvoice;
};

// Stub Hotel.findOne().lean() used by pdfService to avoid a DB call in this test
const Hotel = require('../src/models/Hotel');
Hotel.findOne = () => ({ lean: async () => ({
  name: 'Test Hotel',
  address: { street: '1 Demo St', city: 'City', state: 'ST', zipCode: '000000' },
  taxPercentage: 12,
  serviceChargePercentage: 5,
  phone: '0000000000',
  email: 'demo@hotel.test'
}) });

// Helper to call controller with fake req/res
const callGenerate = (bookingId) => {
  return new Promise((resolve) => {
    const req = { body: { bookingId }, user: { _id: 'USERID' } };
    const res = {
      status(code) { this._status = code; return this; },
      json(payload) { resolve({ status: this._status || 200, payload }); }
    };
    controller.generateInvoice(req, res, () => {});
  });
};

(async () => {
  console.log('Running idempotency test (no DB)...');
  const bookingId = 'BKTEST_ID';

  const first = await callGenerate(bookingId);
  console.log('First call:', first.status, first.payload.message || first.payload);

  const second = await callGenerate(bookingId);
  console.log('Second call:', second.status, second.payload.message || second.payload);

  if (first.payload.success && second.payload.success && first.payload.data.filename && second.payload.data.filename && first.payload.data.filename === second.payload.data.filename) {
    console.log('✅ Idempotency behavior OK — second call returned existing invoice');
    process.exitCode = 0;
  } else {
    console.error('❌ Idempotency test failed — responses differ or second failed');
    process.exitCode = 2;
  }
})();
