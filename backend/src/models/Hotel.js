const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide hotel name'],
      unique: true,
    },
    description: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    phone: String,
    email: String,
    website: String,
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    hotelRules: [String],
    checkInTime: {
      type: String,
      default: '14:00',
    },
    checkOutTime: {
      type: String,
      default: '11:00',
    },
    taxPercentage: {
      type: Number,
      default: 5,
    },
    serviceChargePercentage: {
      type: Number,
      default: 0,
    },
    cancellationPolicy: String,
    amenities: [String],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hotel', hotelSchema);
