const express = require('express');
const {
  generateInvoice,
  downloadInvoice,
  getUserInvoices,
  getInvoice,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// User routes
router.post('/', protect, generateInvoice);
router.get('/my-invoices', protect, getUserInvoices);
router.get('/:id', protect, getInvoice);
router.get('/download/:filename', downloadInvoice);

module.exports = router;
