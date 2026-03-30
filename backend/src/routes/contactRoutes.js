const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Public endpoints
router.post('/send', contactController.sendContactMessage);
router.get('/info', contactController.getContactInfo);

// Admin endpoints (would be protected with auth middleware in production)
router.get('/', contactController.getAllContacts);
router.get('/:id', contactController.getContact);
router.put('/:id/status', contactController.updateContactStatus);
router.post('/:id/response', contactController.sendResponse);

module.exports = router;
