const express = require('express');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/profile/picture', protect, upload.profile.single('profilePicture'), uploadProfilePicture);
router.put('/change-password', protect, changePassword);
router.post('/logout', logout);

module.exports = router;
