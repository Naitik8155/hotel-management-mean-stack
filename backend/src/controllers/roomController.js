const Room = require('../models/Room');
const { uploadImage, deleteImage } = require('../utils/cloudinaryService');
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

function normalizeImageUrls(roomDoc) {
  if (!roomDoc) return roomDoc;
  const room = roomDoc.toObject ? roomDoc.toObject() : roomDoc;
  if (Array.isArray(room.images)) {
    room.images = room.images.map((img) => {
      if (!img || !img.url) return img;
      let url = img.url;
      
      // Fix malformed 'uploadsrooms' → 'uploads/rooms'
      url = url.replace(/uploadsrooms/gi, 'uploads/rooms');
      
      // Fix space variants 'uploads rooms' → 'uploads/rooms'
      url = url.replace(/uploads\s+rooms/gi, 'uploads/rooms');
      
      // Collapse multiple slashes (but preserve http://)
      url = url.replace(/([^:]\/)\/+/g, '$1');
      
      // If it's already a full URL (http/https), return as-is
      if (url.startsWith('http')) {
        return { ...img, url };
      }
      
      // For relative URLs, ensure proper path and add BASE_URL
      if (!url.startsWith('/uploads/rooms/')) {
        // Remove any partial paths
        url = url.replace(/^.*\/uploads\/rooms\//i, '/uploads/rooms/');
        url = url.replace(/^.*\/uploads\/?/i, '/uploads/rooms/');
        url = url.replace(/^\/+/, '');
        url = `/uploads/rooms/${url}`;
      }
      
      return { ...img, url: `${BASE_URL}${url}` };
    });
  }
  return room;
}
const fs = require('fs');

// Get all rooms
exports.getRooms = async (req, res, next) => {
  try {
    const { roomType, minPrice, maxPrice, isAvailable } = req.query;

    let filter = {};

    if (roomType) filter.roomType = roomType;
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = parseInt(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = parseInt(maxPrice);
    }
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    const rooms = await Room.find(filter).populate('createdBy', 'name email');
    const normalized = rooms.map((r) => normalizeImageUrls(r));

    res.status(200).json({
      success: true,
      count: normalized.length,
      data: normalized,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single room
exports.getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate('createdBy', 'name email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json({
      success: true,
      data: normalizeImageUrls(room),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create room (Admin only)
exports.createRoom = async (req, res, next) => {
  try {
    console.log('[createRoom] Incoming body:', req.body);
    console.log('[createRoom] Incoming files count:', (req.files || []).length);
    // Parse amenities if it's a JSON string (from FormData)
    let amenitiesArray = req.body.amenities;
    if (typeof amenitiesArray === 'string') {
      try {
        amenitiesArray = JSON.parse(amenitiesArray);
      } catch (e) {
        amenitiesArray = [];
      }
    }
    
    const { roomNumber, roomType, description } = req.body;
    // Coerce types from FormData strings
    const maxGuests = req.body.maxGuests !== undefined ? Number(req.body.maxGuests) : undefined;
    const pricePerNight = req.body.pricePerNight !== undefined ? Number(req.body.pricePerNight) : undefined;
    const floor = req.body.floor !== undefined ? Number(req.body.floor) : undefined;
    const isAvailable = req.body.isAvailable !== undefined
      ? (req.body.isAvailable === true || req.body.isAvailable === 'true')
      : undefined;

    const isFeatured = req.body.isFeatured !== undefined
      ? (req.body.isFeatured === true || req.body.isFeatured === 'true')
      : undefined;

    // Check if room number already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    // Map frontend room types to backend enum values
    const roomTypeMap = {
      'single': 'Standard',
      'double': 'Deluxe',
      'suite': 'Suite',
      'deluxe': 'Deluxe'
    };

    const roomData = {
      roomNumber,
      roomType: roomTypeMap[roomType?.toLowerCase()] || 'Standard',
      description,
      maxGuests,
      pricePerNight,
      amenities: amenitiesArray || [],
      floor,
      status: isAvailable === false ? 'unavailable' : 'available',
      isAvailable: isAvailable === undefined ? true : isAvailable,
      isFeatured: isFeatured === undefined ? false : isFeatured,
    };

    // Only add createdBy if user is authenticated
    if (req.user && req.user._id) {
      roomData.createdBy = req.user._id;
    }

    // Handle image uploads if files are provided
    if (req.files && req.files.length > 0) {
      const images = [];
      try {
        for (let file of req.files) {
          const result = await uploadImage(file.path, 'hotel-management/rooms');
          images.push(result);
          // Only delete the temp file if successfully uploaded to cloudinary
          if (result.storage === 'cloudinary') {
            try { fs.unlink(file.path, () => {}); } catch (_) {}
          }
        }
      } catch (uploadErr) {
        console.error('[createRoom] Image upload failed:', uploadErr);
        // Continue without images (non-blocking)
      }
      roomData.images = images;
    }

    const room = await Room.create(roomData);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: normalizeImageUrls(room),
    });
  } catch (error) {
    console.error('Create room error:', error);
    if (error && error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((val) => val.message)
        .join(', ');
      return res.status(400).json({ success: false, message });
    }
    if (error && error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate field value entered' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// Update room (Admin only)
exports.updateRoom = async (req, res, next) => {
  try {
    console.log('[updateRoom] ID:', req.params.id);
    console.log('[updateRoom] Body keys:', Object.keys(req.body));
    
    const roomId = req.params.id;
    
    // Parse amenities if it's a JSON string (from FormData)
    if (req.body.amenities && typeof req.body.amenities === 'string') {
      try {
        req.body.amenities = JSON.parse(req.body.amenities);
      } catch (e) {
        req.body.amenities = [];
      }
    }
    
    // Coerce numeric and boolean fields from FormData strings
    if (req.body.maxGuests !== undefined) req.body.maxGuests = Number(req.body.maxGuests);
    if (req.body.pricePerNight !== undefined) req.body.pricePerNight = Number(req.body.pricePerNight);
    if (req.body.floor !== undefined) req.body.floor = Number(req.body.floor);
    if (req.body.isAvailable !== undefined) req.body.isAvailable = (req.body.isAvailable === true || req.body.isAvailable === 'true');
    if (req.body.isFeatured !== undefined) req.body.isFeatured = (req.body.isFeatured === true || req.body.isFeatured === 'true');

    let room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: 'Room not found' 
      });
    }

    // Map frontend room types if needed
    const roomTypeMap = {
      'single': 'Standard',
      'double': 'Deluxe',
      'suite': 'Suite',
      'deluxe': 'Deluxe'
    };

    // Update fields only if provided
    if (req.body.roomNumber !== undefined) room.roomNumber = req.body.roomNumber;
    if (req.body.roomType !== undefined) {
      room.roomType = roomTypeMap[req.body.roomType?.toLowerCase()] || req.body.roomType;
    }
    if (req.body.description !== undefined) room.description = req.body.description;
    if (req.body.maxGuests !== undefined) room.maxGuests = Number(req.body.maxGuests);
    if (req.body.pricePerNight !== undefined) room.pricePerNight = Number(req.body.pricePerNight);
    if (req.body.amenities !== undefined) room.amenities = req.body.amenities;
    if (req.body.floor !== undefined) room.floor = Number(req.body.floor);
    if (req.body.status !== undefined) room.status = req.body.status;
    if (req.body.isAvailable !== undefined) {
      room.isAvailable = (req.body.isAvailable === true || req.body.isAvailable === 'true');
      room.status = room.isAvailable ? 'available' : 'unavailable';
    }

    if (req.body.isFeatured !== undefined) {
      room.isFeatured = (req.body.isFeatured === true || req.body.isFeatured === 'true');
    }

    // Handle image uploads if files are provided
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await uploadImage(file.path, 'hotel-management/rooms');
        room.images.push(result);
        if (result.storage === 'cloudinary') {
          try { fs.unlink(file.path, () => {}); } catch (_) {}
        }
      }
    }

    // Use runValidators: false and validateBeforeSave: false for partial updates
    room = await room.save({ runValidators: false, validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: normalizeImageUrls(room),
    });
  } catch (error) {
    console.error('Room update error:', error);
    console.error('Room update error message:', error.message);
    console.error('Room update error errors:', error.errors);
    console.error('Room update error code:', error.code);
    console.error('Room update error name:', error.name);
    if (error && error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((val) => val.message)
        .join(', ');
      console.error('Validation error details:', message);
      return res.status(400).json({ success: false, message, errors: error.errors });
    }
    if (error && error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate field value entered' });
    }
    // Return 400 with detailed error if available
    if (error.statusCode && error.statusCode >= 400) {
      return res.status(error.statusCode).json({ 
        success: false,
        message: error.message || 'Failed to update room'
      });
    }
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to update room',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete room (Admin only)
exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Delete images from Cloudinary
    if (room.images && room.images.length > 0) {
      for (let image of room.images) {
        await deleteImage(image.publicId);
      }
    }

    await Room.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete room image
exports.deleteRoomImage = async (req, res, next) => {
  try {
    const { roomId, imageIndex } = req.params;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const image = room.images[imageIndex];
    if (image) {
      await deleteImage(image.publicId);
      room.images.splice(imageIndex, 1);
      await room.save();
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: room,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
