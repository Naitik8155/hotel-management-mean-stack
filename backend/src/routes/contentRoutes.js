const router = require('express').Router();
const {
  getBanners,
  getAllBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  getTestimonials,
  createTestimonial,
  getHotelDetails,
  getFeaturedRooms
} = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/banners', getBanners);
router.get('/banners/:id', getBanner);
router.get('/testimonials', getTestimonials);
router.get('/hotel', getHotelDetails);
router.get('/featured-rooms', getFeaturedRooms);

// Protected routes - User can create testimonials
router.post('/testimonials', protect, createTestimonial);

// Admin only routes
router.get('/admin/banners', protect, authorize('admin'), getAllBanners);
router.post('/banners', protect, authorize('admin'), upload.banner.single('imageUrl'), createBanner);
router.put('/banners/:id', protect, authorize('admin'), upload.banner.single('imageUrl'), updateBanner);
router.delete('/banners/:id', protect, authorize('admin'), deleteBanner);


module.exports = router;
