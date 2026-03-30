// quick test to generate invoice without needing a DB
const path = require('path');
// stub Hotel model before requiring pdfService
const hotelModPath = path.resolve(__dirname, '../src/models/Hotel.js');
require.cache[hotelModPath] = {
  exports: {
    findOne: () => ({
      lean: async () => ({
        name: 'Demo Hotel',
        address: { street: '1 Demo St', city: 'City', state: 'ST', zipCode: '000000' },
        taxPercentage: 12,
        serviceChargePercentage: 5,
        phone: '0000000000',
        email: 'demo@hotel.test',
      }),
    }),
  },
};

(async () => {
  try {
    const svc = require('../src/utils/pdfService.js');
    const booking = {
      roomId: { roomType: 'Deluxe', roomNumber: '101' },
      bookingNumber: 'BKG123',
      checkInDate: Date.now(),
      checkOutDate: Date.now() + 86400000,
      numberOfNights: 1,
      numberOfGuests: 2,
      roomPrice: 2500,
      guestDetails: { firstName: 'Test', lastName: 'User', email: 'test@example.com', phone: '9999999999' },
      extraServices: [{ serviceName: 'Breakfast', quantity: 2, price: 200, total: 400 }],
    };
    const payment = { paymentMethod: 'razorpay', createdAt: new Date().toISOString(), transactionDetails: { transactionId: 'TXN123' } };
    const res = await svc.generateInvoicePDF(booking, payment);
    console.log('OK', res);
  } catch (err) {
    console.error('ERR', err);
    process.exitCode = 1;
  }
})();
