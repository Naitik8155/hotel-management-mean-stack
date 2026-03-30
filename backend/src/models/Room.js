const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please provide a room number'],
      unique: true,
      trim: true,
    },
    roomType: {
      type: String,
      enum: ['Standard', 'Deluxe', 'Suite', 'Presidential'],
      required: [true, 'Please select a room type'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    maxGuests: {
      type: Number,
      required: [true, 'Please provide maximum guests'],
      min: [1, 'Max guests must be at least 1'],
      max: [10, 'Max guests cannot exceed 10'],
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Please provide price per night'],
      min: [0, 'Price cannot be negative'],
    },
    amenities: [
      {
        type: String,
        enum: [
          'WiFi',
          'AC',
          'TV',
          'Mini Bar',
          'Gym',
          'Swimming Pool',
          'Spa',
          'Restaurant',
          'Parking',
          'Room Service',
          'Balcony',
          'Bathtub',
        ],
      },
    ],
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    // Whether this room is highlighted on the public Home page
    isFeatured: {
      type: Boolean,
      default: false,
    },
    floor: {
      type: Number,
      required: [true, 'Please provide floor number'],
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
