const mongoose = require('mongoose');
const Room = require('../models/Room');
require('dotenv').config({ path: '../../.env' });

/**
 * Idempotent script to mark rooms as featured so they appear in Home → Featured Rooms.
 * Usage:
 *  - Edit the `ROOM_NUMBERS` array below and run: npm run seed:featured
 *  - Or set env var ROOM_NUMBERS="101,201,301" and run the script.
 */

const ROOM_NUMBERS = (process.env.ROOM_NUMBERS || '').split(',').map(s => s.trim()).filter(Boolean);
const DEFAULT_COUNT = 4;

async function run() {
  const mongo = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management';
  await mongoose.connect(mongo, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB — markFeaturedRooms seed');

  try {
    if (ROOM_NUMBERS.length > 0) {
      console.log('Marking by roomNumber:', ROOM_NUMBERS);
      const res = await Room.updateMany(
        { roomNumber: { $in: ROOM_NUMBERS } },
        { $set: { isFeatured: true } }
      );
      console.log(`Matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    } else {
      // No explicit list provided — pick up to DEFAULT_COUNT most recent rooms and mark them
      const candidates = await Room.find({}).sort({ createdAt: -1 }).limit(DEFAULT_COUNT).select('_id roomNumber isFeatured');
      if (!candidates.length) {
        console.log('No rooms found in DB. Add rooms first or provide ROOM_NUMBERS env var.');
        await mongoose.disconnect();
        return;
      }

      const idsToMark = candidates.filter(r => !r.isFeatured).map(r => r._id);
      if (!idsToMark.length) {
        console.log(`Top ${DEFAULT_COUNT} rooms are already featured; nothing to do.`);
        await mongoose.disconnect();
        return;
      }

      const res = await Room.updateMany({ _id: { $in: idsToMark } }, { $set: { isFeatured: true } });
      console.log(`Marked ${res.modifiedCount} room(s) as featured (auto-selection).`);
      console.log('Rooms marked:', candidates.map(c => ({ roomNumber: c.roomNumber, wasFeatured: c.isFeatured })));
    }

    console.log('Seed complete — verify with GET /api/content/featured-rooms');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed failed:', err.message || err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
