const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../../.env' });

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('✓ Admin user already exists:', adminExists.email);
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@hotelmanagement.com',
      password: 'Admin@123', // Will be hashed by schema
      phone: '9999999999',
      role: 'admin',
      isActive: true,
    });

    console.log('✓ Admin user created successfully!');
    console.log('Email:', adminUser.email);
    console.log('Password: Admin@123');
    console.log('Role:', adminUser.role);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();
