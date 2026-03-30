const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create invoices directory if it doesn't exist
const invoicesDir = path.join(__dirname, '../../invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

const generateInvoicePDF = async (bookingDetails, paymentDetails) => {
  const Hotel = require('../models/Hotel');

  return new Promise(async (resolve, reject) => {
    try {
      const hotel = (await Hotel.findOne().lean()) || {};

      // PDF document settings
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      const invoiceNumber = bookingDetails.bookingNumber ? `INV-${bookingDetails.bookingNumber}` : `INV-${Date.now()}`;
      const filename = `invoice-${invoiceNumber}.pdf`;
      const filepath = path.join(invoicesDir, filename);

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // --- Colors & Branding ---
      const primaryColor = '#1a1a1a';
      const secondaryColor = '#7a7a7a';
      const accentColor = '#c5a059'; // Refined Gold
      const borderColor = '#e5e7eb';

      const money = (v) => `INR ${new Intl.NumberFormat('en-IN').format(Math.round(v || 0))}`;

      // --- 1. Top Header Section ---
      // Logo and Brand
      doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text(hotel.name?.toUpperCase() || 'GRAND LUXE', 50, 50);
      doc.fillColor(accentColor).fontSize(8).font('Helvetica').text('THE EPITOME OF ELEGANCE', 50, 75, { characterSpacing: 2 });

      // Invoice Label (Top Right)
      doc.fillColor(primaryColor).fontSize(30).font('Helvetica-Bold').text('INVOICE', 350, 45, { align: 'right', width: 195 });

      doc.moveTo(50, 95).lineTo(545, 95).lineWidth(2).stroke(accentColor);

      // --- 2. Information Grid ---
      let y = 120;

      // Left: Hotel Address
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold').text('FROM:', 50, y);
      doc.fillColor(secondaryColor).font('Helvetica').fontSize(9);
      const hAddr = hotel.address ? `${hotel.address.street || ''}, ${hotel.address.city || ''}, ${hotel.address.state || ''}` : '101 Heritage Mansion, Royal District, India';
      doc.text(hAddr, 50, y + 15, { width: 180 });
      doc.text(`T: ${hotel.phone || '+91 000 000 0000'}`, 50, y + 35);
      doc.text(`E: ${hotel.email || 'concierge@grandluxe.com'}`, 50, y + 47);

      // Center: Invoice Metadata
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold').text('DETAILS:', 250, y);
      doc.fillColor(secondaryColor).font('Helvetica').fontSize(9);
      doc.text(`Number: ${invoiceNumber}`, 250, y + 15);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 250, y + 27);
      doc.text(`Booking: #${bookingDetails.bookingNumber}`, 250, y + 39);

      // Right: Guest Information
      const guest = bookingDetails.guestDetails || {};
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold').text('BILL TO:', 400, y);
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text(`${guest.firstName || ''} ${guest.lastName || ''}`.toUpperCase(), 400, y + 15);
      doc.fillColor(secondaryColor).font('Helvetica').fontSize(9);
      doc.text(guest.address || 'Registered Guest', 400, y + 30, { width: 145 });
      doc.text(guest.email || '', 400, y + 55);

      // --- 3. Stay Context (Shaded Box) ---
      y += 90;
      doc.rect(50, y, 495, 35).fill('#fbfaf7'); // Very light cream
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8);

      doc.text('CHECK-IN', 70, y + 12);
      doc.text('CHECK-OUT', 180, y + 12);
      doc.text('SUITE CATEGORY', 290, y + 12);
      doc.text('OCCUPANCY', 460, y + 12);

      doc.fillColor(accentColor).font('Helvetica').fontSize(9);
      doc.text(new Date(bookingDetails.checkInDate).toLocaleDateString('en-IN'), 70, y + 22);
      doc.text(new Date(bookingDetails.checkOutDate).toLocaleDateString('en-IN'), 180, y + 22);
      doc.text(bookingDetails.roomId?.roomType?.toUpperCase() || 'LUXURY SUITE', 290, y + 22);
      doc.text(`${bookingDetails.numberOfGuests} Guests`, 460, y + 22);

      // --- 4. Table Section ---
      y += 60;
      // Header
      doc.moveTo(50, y).lineTo(545, y).lineWidth(0.5).stroke(borderColor);
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8);
      doc.text('DESCRIPTION', 50, y + 8);
      doc.text('UNIT PRICE', 300, y + 8, { width: 80, align: 'right' });
      doc.text('QTY', 390, y + 8, { width: 40, align: 'center' });
      doc.text('TOTAL', 445, y + 8, { width: 100, align: 'right' });

      y += 25;
      doc.moveTo(50, y).lineTo(545, y).lineWidth(0.5).stroke(primaryColor);
      y += 10;

      // Rows
      doc.font('Helvetica').fontSize(9).fillColor(primaryColor);

      const renderRow = (desc, price, qty, total) => {
        doc.text(desc, 50, y, { width: 240 });
        doc.text(money(price), 300, y, { width: 80, align: 'right' });
        doc.text(String(qty), 390, y, { width: 40, align: 'center' });
        doc.text(money(total), 445, y, { width: 100, align: 'right' });
        y += 25;
        doc.moveTo(50, y - 5).lineTo(545, y - 5).lineWidth(0.1).stroke(borderColor);
      };

      // Main Stay
      const roomPrice = Number(bookingDetails.roomPrice || bookingDetails.pricePerNight || 0);
      const nights = Number(bookingDetails.numberOfNights || 1);
      renderRow(`${bookingDetails.roomId?.roomType || 'Accommodation'} Services`, roomPrice, nights, roomPrice * nights);

      // Extras
      const extras = bookingDetails.extraServices || [];
      extras.forEach(s => {
        const qty = Number(s.quantity || 1);
        const price = Number(s.price || 0);
        const sTotal = (s.total != null) ? s.total : (price * qty);
        renderRow(s.serviceName, price, qty, sTotal);
      });

      // --- 5. Calculation Section ---
      y += 15;
      const subtotal = (roomPrice * nights) + extras.reduce((acc, e) => acc + (Number(e.total) || (Number(e.price) * (Number(e.quantity) || 1))), 0);
      const tax = Math.round((subtotal - (Number(bookingDetails.discountAmount) || 0)) * 0.12);
      const discount = Number(bookingDetails.discountAmount) || 0;
      const total = subtotal + tax - discount;

      const rightAlignX = 350;
      const valAlignX = 445;

      const renderTotalLine = (label, val, isBold = false) => {
        doc.fillColor(isBold ? primaryColor : secondaryColor).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(isBold ? 10 : 9);
        doc.text(label, rightAlignX, y, { width: 90, align: 'left' });
        doc.text(val, valAlignX, y, { width: 100, align: 'right' });
        y += 20;
      };

      renderTotalLine('SUBTOTAL', money(subtotal));
      renderTotalLine('GST (12%)', money(tax));
      if (discount > 0) renderTotalLine('DISCOUNT', `- ${money(discount)}`);

      doc.moveTo(rightAlignX, y).lineTo(545, y).lineWidth(1).stroke(accentColor);
      y += 10;
      renderTotalLine('TOTAL AMOUNT', money(total), true);

      // --- 6. Footer & Payment Status ---
      const statusY = y - 40;
      const isPaid = paymentDetails.status === 'completed';
      const statusColor = isPaid ? '#15803d' : '#b45309';

      doc.rect(50, statusY, 180, 45).lineWidth(0.5).stroke(borderColor);
      doc.fillColor(secondaryColor).fontSize(7).text('PAYMENT STATUS', 60, statusY + 10);
      doc.fillColor(statusColor).fontSize(14).font('Helvetica-Bold').text(isPaid ? 'PAID IN FULL' : 'PENDING', 60, statusY + 20);

      // Terms
      const footerY = 720;
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text('TERMS & CONDITIONS', 50, footerY);
      doc.fillColor(secondaryColor).font('Helvetica').fontSize(7);
      const terms = '1. This is a system-generated document. 2. All luxury services are subject to 12% GST. 3. Cancellations are governed by the Grand Luxe Heritage Policy. 4. Disputes must be reported within 48 hours of check-out.';
      doc.text(terms, 50, footerY + 12, { width: 495, lineGap: 2 });

      doc.moveTo(50, 780).lineTo(545, 780).lineWidth(0.5).stroke(borderColor);
      doc.text('www.grandluxe.com • Heritage Park, India • Excellence Since 1924', 50, 790, { align: 'center', width: 495 });

      doc.end();

      stream.on('finish', () => {
        resolve({ success: true, filename, filepath, invoiceNumber, total });
      });

      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

const getInvoiceFile = (filename) => {
  const filepath = path.join(invoicesDir, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error('Invoice not found');
  }
  return filepath;
};

module.exports = {
  generateInvoicePDF,
  getInvoiceFile,
};
