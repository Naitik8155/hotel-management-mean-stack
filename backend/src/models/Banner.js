const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a banner title'],
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    imageUrl: {
      type: String,
      required: [true, 'Please provide a banner image URL']
    },
    imagePublicId: {
      type: String // For Cloudinary deletion
    },
    ctaText: {
      type: String, // Call-to-action button text
      default: 'Book Now'
    },
    ctaLink: {
      type: String, // Where the button links to
      default: '/rooms'
    },
    priority: {
      type: Number, // Lower number = higher priority (display order)
      default: 1
    },
    isActive: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date // Optional: banner expiration
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// Index for active banners ordered by priority
bannerSchema.index({ isActive: 1, priority: 1, startDate: -1 });

module.exports = mongoose.model('Banner', bannerSchema);
