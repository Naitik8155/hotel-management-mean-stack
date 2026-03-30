const express = require('express');
const {
  createPaymentOrder,
  verifyPayment,
  getPayment,
  getAllPayments,
  processRefund,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.get('/:id', protect, getPayment);

// Admin only
router.get('/', protect, authorize('admin'), getAllPayments);
router.post('/:id/refund', protect, authorize('admin'), processRefund);

module.exports = router;
