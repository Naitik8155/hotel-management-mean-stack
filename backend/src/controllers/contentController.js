const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const { uploadImage, deleteImage } = require('../utils/cloudinaryService');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

function normalizeBannerUrls(bannerDoc) {
  if (!bannerDoc) return bannerDoc;
  const banner = bannerDoc.toObject ? bannerDoc.toObject() : bannerDoc;

  if (banner.imageUrl) {
    let url = banner.imageUrl;

    // If it's already a full URL (http/https), return as-is
    if (url.startsWith('http')) {
      return banner;
    }

    // Repair malformed URLs
    url = url.replace(/uploads\s*banners/gi, 'uploads/banners');
    url = url.replace(/\\/g, '/');

    // For local relative paths, ensure proper prefix and add BASE_URL
    if (!url.startsWith('/uploads/banners/')) {
      // Remove any partial paths
      url = url.replace(/^.*\/uploads\/?/i, '/uploads/banners/');
      url = url.replace(/^\/+/, '');
      if (!url.startsWith('uploads/')) {
        url = `uploads/banners/${url}`;
      }
      url = `/${url}`;
    }

    // Collapse multiple slashes (but preserve http://)
    url = url.replace(/([^:]\/)\/+/g, '$1');

    banner.imageUrl = `${BASE_URL}${url}`;
  }

  return banner;
}

// @desc    Get all active banners for homepage
// @route   GET /api/content/banners
// @access  Public
exports.getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({
      isActive: true
    })
      .sort({ priority: 1, createdAt: -1 });

    const normalized = banners.map(b => normalizeBannerUrls(b));

    res.status(200).json({
      success: true,
      count: normalized.length,
      data: normalized
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all banners (Admin only)
// @route   GET /api/content/admin/banners
// @access  Private/Admin
exports.getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ priority: 1, createdAt: -1 });
    const normalized = banners.map(b => normalizeBannerUrls(b));

    res.status(200).json({
      success: true,
      count: normalized.length,
      data: normalized
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single banner
// @route   GET /api/content/banners/:id
// @access  Public
exports.getBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id).populate('createdBy', 'name email');

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: normalizeBannerUrls(banner)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new banner
// @route   POST /api/content/banners
// @access  Private/Admin
exports.createBanner = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;

    // Handle image upload if file is provided
    if (req.file) {
      try {
        const result = await uploadImage(req.file.path, 'hotel-management/banners');
        req.body.imageUrl = result.url;
        req.body.imagePublicId = result.publicId;

        // Only delete the temp file if successfully uploaded to cloudinary
        if (result.storage === 'cloudinary') {
          try { fs.unlink(req.file.path, () => { }); } catch (_) { }
        }
      } catch (uploadErr) {
        console.error('[createBanner] Image upload failed:', uploadErr);
        // Fallback or error handled by uploadImage itself
      }
    }

    const banner = await Banner.create(req.body);

    res.status(201).json({
      success: true,
      data: normalizeBannerUrls(banner)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update banner
// @route   PUT /api/content/banners/:id
// @access  Private/Admin
exports.updateBanner = async (req, res, next) => {
  try {
    let banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Handle new image upload if provided
    if (req.file) {
      try {
        // Delete old image if it exists
        if (banner.imagePublicId) {
          await deleteImage(banner.imagePublicId);
        }

        const result = await uploadImage(req.file.path, 'hotel-management/banners');
        req.body.imageUrl = result.url;
        req.body.imagePublicId = result.publicId;

        if (result.storage === 'cloudinary') {
          try { fs.unlink(req.file.path, () => { }); } catch (_) { }
        }
      } catch (uploadErr) {
        console.error('[updateBanner] Image upload failed:', uploadErr);
      }
    }

    banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: normalizeBannerUrls(banner)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete banner
// @route   DELETE /api/content/banners/:id
// @access  Private/Admin
exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Delete image from Cloudinary/disk if exists
    if (banner.imagePublicId) {
      await deleteImage(banner.imagePublicId);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Get all published testimonials
// @route   GET /api/content/testimonials
// @access  Public
exports.getTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({
      isPublished: true,
      isApproved: true
    })
      .populate('userId', 'name email profileImage')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new testimonial (User only)
// @route   POST /api/content/testimonials
// @access  Private/User
exports.createTestimonial = async (req, res, next) => {
  try {
    const { bookingId, guestName, rating, title, comment } = req.body;

    if (!guestName || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const testimonial = await Testimonial.create({
      userId: req.user.id,
      bookingId,
      guestName,
      guestPhoto: req.user.profileImage,
      rating,
      title,
      comment,
      isApproved: false,
      isPublished: false
    });

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully. Awaiting admin approval.',
      data: testimonial
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get hotel details
// @route   GET /api/content/hotel
// @access  Public
exports.getHotelDetails = async (req, res, next) => {
  try {
    const hotel = await Hotel.findOne().select('-__v');

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel details not found'
      });
    }

    res.status(200).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get featured rooms
// @route   GET /api/content/featured-rooms
// @access  Public
exports.getFeaturedRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ isFeatured: true })
      .select('roomNumber roomType pricePerNight images description amenities')
      .limit(6);

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};