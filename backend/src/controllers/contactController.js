const Contact = require('../models/Contact');
const { emailService } = require('../utils/emailService');

// Get all contact messages
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contacts', error: error.message });
  }
};

// Get single contact message
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contact', error: error.message });
  }
};

// Send contact message
exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create contact document
    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message,
      status: 'new'
    });

    await contact.save();

    // Send emails asynchronously
    try {
      await emailService.sendContactNotification({ name, email, phone, subject, message });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: contact
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Update contact status
exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'in-progress', 'resolved'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.status(200).json({
      message: 'Status updated',
      data: contact
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
};

// Send response to contact message
exports.sendResponse = async (req, res) => {
  try {
    const { responseMessage } = req.body;

    if (!responseMessage) {
      return res.status(400).json({ message: 'Response message is required' });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        adminResponse: responseMessage,
        respondedAt: new Date(),
        status: 'resolved'
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Send response email
    try {
      await emailService.sendContactResponse({
        email: contact.email,
        name: contact.name,
        response: responseMessage
      });
    } catch (emailError) {
      console.error('Response email failed:', emailError);
    }

    res.status(200).json({
      message: 'Response sent',
      data: contact
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending response', error: error.message });
  }
};

// Get contact info
exports.getContactInfo = (req, res) => {
  try {
    const info = {
      address: '123 Hotel Street, City, State 12345, Country',
      phone: '+1 (555) 123-4567',
      email: 'info@hotelmanagement.com',
      supportEmail: 'support@hotelmanagement.com',
      hours: {
        weekday: '9:00 AM - 6:00 PM',
        saturday: '10:00 AM - 4:00 PM',
        sunday: 'Closed'
      }
    };
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching info', error: error.message });
  }
};
