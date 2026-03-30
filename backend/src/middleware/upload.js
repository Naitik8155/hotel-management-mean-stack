const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ROOM_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'rooms');
const PROFILE_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'profile');
const BANNER_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'banners');

try {
  fs.mkdirSync(ROOM_UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(PROFILE_UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(BANNER_UPLOAD_DIR, { recursive: true });
} catch (e) {
  // ignore
}

// Disk storage with unique filenames for rooms
const roomStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ROOM_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  }
});

// Disk storage with unique filenames for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PROFILE_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  }
});

// Disk storage with unique filenames for banners
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BANNER_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'banner-' + unique + path.extname(file.originalname).toLowerCase());
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const roomUpload = multer({
  storage: roomStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const profileUpload = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const bannerUpload = multer({
  storage: bannerStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = {
  single: (fieldName) => {
    // Default to room upload
    return roomUpload.single(fieldName);
  },
  room: roomUpload,
  profile: profileUpload,
  banner: bannerUpload
};

