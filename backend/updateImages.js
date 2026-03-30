const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Room = require('./src/models/Room');

async function updateRoomImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    console.log('Connected to MongoDB');

    // Get all rooms
    const rooms = await Room.find({});
    console.log(`Found ${rooms.length} rooms\n`);

    // Available images
    const images = [
      '1767788824853-462121118.png',
      '1767854246954-190087488.jpeg',
      '1767854255285-51574626.jpeg',
      '1767854832183-513231574.jpeg'
    ];

    let imageIndex = 0;
    
    // Update each room with an available image
    for (const room of rooms) {
      if (imageIndex < images.length) {
        const filename = images[imageIndex];
        await Room.findByIdAndUpdate(
          room._id,
          {
            images: [
              {
                url: `/uploads/rooms/${filename}`,
                publicId: filename
              }
            ]
          },
          { new: true }
        );
        console.log(`Updated Room ${room.roomNumber} (${room._id}) with ${filename}`);
        imageIndex++;
      }
    }

    await mongoose.disconnect();
    console.log('\nDone - All rooms updated!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateRoomImages();
