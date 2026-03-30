const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath, folder = 'hotel-management') => {
  try {
    console.log('[uploadImage] Uploading:', filePath);
    const result = await cloudinary.uploader.upload(filePath, { folder, resource_type: 'auto' });
    console.log('[uploadImage] Success:', result.secure_url);
    return { url: result.secure_url, publicId: result.public_id, storage: 'cloudinary' };
  } catch (error) {
    console.error('[uploadImage] Cloudinary error:', error.message);
    // Use relative path for local fallback - keep file on disk
    const filename = path.basename(filePath);
    const localUrl = `/uploads/rooms/${filename}`;
    console.log('[uploadImage] Fallback to local:', localUrl);
    return { url: localUrl, publicId: filename, storage: 'local' };
  }
};

const deleteImage = async (publicId) => {
  if (!publicId) return false;

  try {
    // 1. Try Cloudinary first
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'ok') return true;

    // 2. If skip or fails, try local file deletion as fallback
    // Try to find and delete in common upload directories
    const searchDirs = [
      path.join(__dirname, '..', 'uploads', 'rooms'),
      path.join(__dirname, '..', 'uploads', 'banners'),
      path.join(__dirname, '..', 'uploads', 'profile')
    ];

    for (const dir of searchDirs) {
      const filePath = path.join(dir, publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('[deleteImage] Local file deleted:', filePath);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[deleteImage] Error during deletion:', error.message);
    return false;
  }
};


module.exports = { uploadImage, deleteImage };
