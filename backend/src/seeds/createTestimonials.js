const mongoose = require('mongoose');
const User = require('../models/User');
const Testimonial = require('../models/Testimonial');
require('dotenv').config({ path: '../../.env' });

const seedTestimonials = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB — seeding testimonials');

    const publishedCount = await Testimonial.countDocuments({ isPublished: true, isApproved: true });
    if (publishedCount >= 4) {
      console.log(`✓ There are already ${publishedCount} published testimonials — skipping seeding.`);
      await mongoose.disconnect();
      return;
    }

    // Ensure an admin exists to mark approvals
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Seed Admin',
        email: 'seed-admin@example.com',
        password: 'SeedAdmin@123',
        role: 'admin',
        isActive: true,
      });
      console.log('✓ Created seed admin:', admin.email);
    }

    // Create distinct guest users for testimonials (idempotent by email)
    const guests = [
      { name: 'Aisha N.', email: 'aisha.seed@example.com' },
      { name: 'Liam R.', email: 'liam.seed@example.com' },
      { name: 'Sofia M.', email: 'sofia.seed@example.com' },
      { name: 'Noah T.', email: 'noah.seed@example.com' }
    ];

    const createdGuests = [];
    for (const g of guests) {
      let user = await User.findOne({ email: g.email });
      if (!user) {
        user = await User.create({
          name: g.name,
          email: g.email,
          password: 'Guest@1234',
          role: 'user',
          isActive: true
        });
        console.log('  • created guest:', g.email);
      }
      createdGuests.push(user);
    }

    const testimonialDocs = [
      {
        userId: createdGuests[0]._id,
        guestName: createdGuests[0].name,
        rating: 5,
        title: 'Exceptional stay',
        comment: 'Clean rooms, friendly staff and excellent breakfast. Highly recommend!',
        isApproved: true,
        isPublished: true,
        approvedAt: new Date(),
        approvedBy: admin._id
      },
      {
        userId: createdGuests[1]._id,
        guestName: createdGuests[1].name,
        rating: 4,
        title: 'Great location',
        comment: 'Amazing location close to the city center — perfect for weekend trips.',
        isApproved: true,
        isPublished: true,
        approvedAt: new Date(),
        approvedBy: admin._id
      },
      {
        userId: createdGuests[2]._id,
        guestName: createdGuests[2].name,
        rating: 5,
        title: 'Wonderful service',
        comment: 'Staff went above and beyond to make our anniversary special.',
        isApproved: true,
        isPublished: true,
        approvedAt: new Date(),
        approvedBy: admin._id
      },
      {
        userId: createdGuests[3]._id,
        guestName: createdGuests[3].name,
        rating: 4,
        title: 'Comfortable & clean',
        comment: 'Comfortable beds and very quiet rooms. Will stay again.',
        isApproved: true,
        isPublished: true,
        approvedAt: new Date(),
        approvedBy: admin._id
      }
    ];

    // Insert only those that don't already exist (by guestName + title)
    for (const t of testimonialDocs) {
      const exists = await Testimonial.findOne({ guestName: t.guestName, title: t.title });
      if (!exists) {
        await Testimonial.create(t);
        console.log(`  ✓ Inserted testimonial — ${t.guestName}: "${t.title}"`);
      } else {
        console.log(`  • Testimonial exists — ${t.guestName}: "${t.title}"`);
      }
    }

    console.log('Seeding complete.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seeding error:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedTestimonials();
