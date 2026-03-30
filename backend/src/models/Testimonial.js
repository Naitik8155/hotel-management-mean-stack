const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user ID']
    },
    bookingId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking'
    },
    guestName: {
      type: String,
      required: [true, 'Please provide guest name']
    },
    guestPhoto: {
      type: String // Profile image URL
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide a rating']
    },
    title: {
      type: String,
      required: [true, 'Please provide testimonial title'],
      maxlength: 100
    },
    comment: {
      type: String,
      required: [true, 'Please provide testimonial comment'],
      maxlength: 1000
    },
    isApproved: {
      type: Boolean,
      default: false // Admin approval required
    },
    isPublished: {
      type: Boolean,
      default: false // Publish on homepage
    },
    approvedAt: {
      type: Date
    },
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Index for published testimonials
testimonialSchema.index({ isPublished: 1, rating: -1, createdAt: -1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
