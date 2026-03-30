const express = require('express');
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  deleteRoomImage,
} = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getRooms);
router.get('/:id', getRoom);

// Admin only
router.post('/', protect, authorize('admin'), upload.room.array('images', 5), createRoom);
router.put('/:id', protect, authorize('admin'), upload.room.array('images', 5), updateRoom);
router.delete('/:id', protect, authorize('admin'), deleteRoom);
router.delete('/:roomId/images/:imageIndex', protect, authorize('admin'), deleteRoomImage);

module.exports = router;
