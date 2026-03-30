const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true // One user can only have one staff profile
        },
        role: {
            type: String,
            enum: ['receptionist', 'housekeeper', 'manager', 'chef', 'maintenance', 'staff'],
            default: 'staff',
        },
        salary: {
            type: Number,
            required: [true, 'Please provide salary'],
            min: [0, 'Salary cannot be negative'],
        },
        shift: {
            type: String,
            enum: ['morning', 'afternoon', 'night'],
            required: [true, 'Please provide shift'],
        },
        joiningDate: {
            type: Date,
            default: Date.now,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        performanceRating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
