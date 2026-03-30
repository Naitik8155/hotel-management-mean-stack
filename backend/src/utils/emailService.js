const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // Helps with some network environments
  }
});

// Verify transporter connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('Email service error:', error);
  } else {
    console.log('Email service ready');
  }
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@hotelmanagement.com',
      to,
      subject,
      html: htmlContent,
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

const generateResetPasswordEmail = (resetUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 5px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: white; padding: 20px; }
        .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Password Reset Request</h2>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>You requested a password reset for your Hotel Management System account.</p>
          <p>Click the button below to reset your password:</p>
          <center>
            <a href="${resetUrl}" class="button">Reset Password</a>
          </center>
          <p><strong>Note:</strong> This link will expire in 24 hours.</p>
          <p>If you didn't request this password reset, please ignore this email or contact support immediately.</p>
        </div>
        <div class="footer">
          <p>© 2024 Hotel Management System. All rights reserved.</p>
          <p>This is an automated email. Please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateBookingConfirmationEmail = (bookingDetails, guestName) => {
  const checkInDate = new Date(bookingDetails.checkInDate).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const checkOutDate = new Date(bookingDetails.checkOutDate).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 5px; }
        .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: white; padding: 20px; }
        .section { margin: 20px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #007bff; }
        .section h3 { margin-top: 0; color: #007bff; }
        .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .details-table td { padding: 10px; border-bottom: 1px solid #ddd; }
        .details-table .label { font-weight: bold; width: 40%; }
        .price-section { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>✓ Booking Confirmed</h2>
          <p>Your reservation is confirmed</p>
        </div>
        <div class="content">
          <p>Dear ${guestName},</p>
          <p>Thank you for booking with us! Your reservation has been confirmed and secured.</p>
          
          <div class="section">
            <h3>Booking Information</h3>
            <table class="details-table">
              <tr>
                <td class="label">Booking Number:</td>
                <td><strong>${bookingDetails.bookingNumber || 'N/A'}</strong></td>
              </tr>
              <tr>
                <td class="label">Booking Status:</td>
                <td><strong>${bookingDetails.bookingStatus || 'Pending'}</strong></td>
              </tr>
              <tr>
                <td class="label">Number of Guests:</td>
                <td>${bookingDetails.numberOfGuests || 1}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h3>Room Details</h3>
            <table class="details-table">
              <tr>
                <td class="label">Room Type:</td>
                <td>${bookingDetails.roomId?.roomType || 'Standard'}</td>
              </tr>
              <tr>
                <td class="label">Room Number:</td>
                <td>${bookingDetails.roomId?.roomNumber || 'TBA'}</td>
              </tr>
              <tr>
                <td class="label">Number of Nights:</td>
                <td>${bookingDetails.numberOfNights || 1}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h3>Check-in & Check-out</h3>
            <table class="details-table">
              <tr>
                <td class="label">Check-in Date:</td>
                <td>${checkInDate}<br><small>From 2:00 PM</small></td>
              </tr>
              <tr>
                <td class="label">Check-out Date:</td>
                <td>${checkOutDate}<br><small>By 11:00 AM</small></td>
              </tr>
            </table>
          </div>

          <div class="price-section">
            <h3 style="margin-top: 0;">Price Summary</h3>
            <table style="width: 100%; border: none;">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">₹${Math.round(bookingDetails.totalAmount / 1.17)}</td>
              </tr>
              <tr>
                <td>GST (12%):</td>
                <td style="text-align: right;">₹${Math.round(bookingDetails.totalAmount * 0.12 / 1.17)}</td>
              </tr>
              <tr>
                <td>Service Charge (5%):</td>
                <td style="text-align: right;">₹${Math.round(bookingDetails.totalAmount * 0.05 / 1.17)}</td>
              </tr>
              <tr style="border-top: 2px solid #0056b3; font-weight: bold; font-size: 16px;">
                <td>Total Amount:</td>
                <td style="text-align: right;">₹${bookingDetails.totalAmount}</td>
              </tr>
            </table>
          </div>

          ${bookingDetails.specialRequests ? `
          <div class="section">
            <h3>Special Requests</h3>
            <p>${bookingDetails.specialRequests}</p>
          </div>
          ` : ''}

          <p style="margin: 20px 0; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 3px;">
            <strong>Payment Status:</strong> ${bookingDetails.paymentStatus === 'completed' ? 'Paid' : 'Pending (Pay at hotel)'}<br>
            <small>Please bring a valid ID and credit card for check-in.</small>
          </p>

          <p>If you have any questions or need to modify your booking, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>© 2024 Hotel Management System. All rights reserved.</p>
          <p>This is an automated email. Please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePaymentConfirmationEmail = (paymentDetails, guestName) => {
  const paymentDate = new Date(paymentDetails.createdAt).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 5px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: white; padding: 20px; }
        .section { margin: 20px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #28a745; }
        .section h3 { margin-top: 0; color: #28a745; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table td { padding: 10px; border-bottom: 1px solid #ddd; }
        .details-table .label { font-weight: bold; width: 40%; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>✓ Payment Received</h2>
          <p>Thank you for your payment</p>
        </div>
        <div class="content">
          <p>Dear ${guestName},</p>
          <p>We have successfully received your payment. Your booking is now fully confirmed.</p>
          
          <div class="section">
            <h3>Payment Details</h3>
            <table class="details-table">
              <tr>
                <td class="label">Transaction ID:</td>
                <td>${paymentDetails.transactionDetails?.transactionId || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Amount Paid:</td>
                <td><strong>₹${paymentDetails.amount}</strong></td>
              </tr>
              <tr>
                <td class="label">Payment Method:</td>
                <td>${paymentDetails.paymentMethod === 'razorpay' ? 'Credit/Debit Card / UPI / Net Banking' : paymentDetails.paymentMethod}</td>
              </tr>
              <tr>
                <td class="label">Payment Date:</td>
                <td>${paymentDate}</td>
              </tr>
              <tr>
                <td class="label">Status:</td>
                <td><strong style="color: #28a745;">Confirmed</strong></td>
              </tr>
            </table>
          </div>

          <p>You will receive an invoice shortly. Please keep this email for your records.</p>
        </div>
        <div class="footer">
          <p>© 2024 Hotel Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendContactNotification = async (contactData) => {
  const { name, email, phone, subject, message } = contactData;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hotelmanagement.com';

  // Email to admin
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 5px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: white; padding: 20px; }
        .field { margin: 15px 0; padding: 10px; background: #f5f5f5; border-left: 4px solid #667eea; }
        .label { font-weight: bold; color: #667eea; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Message</h2>
        </div>
        <div class="content">
          <div class="field">
            <span class="label">From:</span> ${name}
          </div>
          <div class="field">
            <span class="label">Email:</span> ${email}
          </div>
          <div class="field">
            <span class="label">Phone:</span> ${phone}
          </div>
          <div class="field">
            <span class="label">Subject:</span> ${subject}
          </div>
          <div class="field">
            <span class="label">Message:</span>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message. Please respond to the customer directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Email to customer
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 5px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: white; padding: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Thank You for Contacting Us</h2>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Thank you for reaching out to us. We have received your message regarding "${subject}" and will get back to you as soon as possible.</p>
          <p>Our team typically responds within 24 business hours.</p>
          <p>If you have any urgent matters, please call us at +1 (555) 123-4567.</p>
          <p>Best regards,<br>Hotel Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated response. Your message has been saved in our system.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Send to admin
    await sendEmail(adminEmail, `New Contact Message: ${subject}`, adminHtml);
    
    // Send confirmation to customer
    await sendEmail(email, 'We received your message', customerHtml);
    
    return true;
  } catch (error) {
    console.error('Error sending contact notification:', error);
    throw error;
  }
};

const sendContactResponse = async (responseData) => {
  const { email, name, response } = responseData;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 5px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: white; padding: 20px; }
        .response { background: #f0f4ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Response to Your Inquiry</h2>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Thank you for your patience. Here is our response to your inquiry:</p>
          <div class="response">
            <p>${response.replace(/\n/g, '<br>')}</p>
          </div>
          <p>If you have any further questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>Hotel Management Team</p>
        </div>
        <div class="footer">
          <p><strong>Contact Us:</strong> +1 (555) 123-4567 | support@hotelmanagement.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail(email, 'Response to Your Message', html);
    return true;
  } catch (error) {
    console.error('Error sending contact response:', error);
    throw error;
  }
};

const emailService = {
  sendEmail,
  generateResetPasswordEmail,
  generateBookingConfirmationEmail,
  generatePaymentConfirmationEmail,
  sendContactNotification,
  sendContactResponse
};

module.exports = {
  sendEmail,
  generateResetPasswordEmail,
  generateBookingConfirmationEmail,
  generatePaymentConfirmationEmail,
  emailService
};
