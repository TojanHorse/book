const express = require('express');
const cloudinary = require('cloudinary').v2;
const { authenticateToken } = require('../middleware/auth');
const { getConfig } = require('../config/validateEnv');

const router = express.Router();
const config = getConfig();

// Configure Cloudinary
cloudinary.config(config.cloudinary);

// Generate signed upload URL
router.post('/upload-signature', authenticateToken, async (req, res) => {
  try {
    const { fileType, resourceType = 'auto' } = req.body;
    const userId = req.user.uniqueAppId;
    
    // Generate timestamp and public_id
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `chat_files/${userId}/${timestamp}`;
    
    // Determine allowed formats based on file type
    let allowedFormats;
    if (fileType === 'image') {
      allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    } else if (fileType === 'video') {
      allowedFormats = ['mp4', 'mov', 'avi', 'webm'];
    } else {
      allowedFormats = null; // Allow any format for documents
    }
    
    const params = {
      timestamp,
      public_id: publicId,
      resource_type: resourceType,
      folder: 'chat_files'
    };
    
    if (allowedFormats) {
      params.allowed_formats = allowedFormats.join(',');
    }
    
    // Generate signature
    const signature = cloudinary.utils.api_sign_request(params, config.cloudinary.api_secret);
    
    res.json({
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      resource_type: resourceType
    });
  } catch (error) {
    console.error('Upload signature error:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
});

// Delete file from Cloudinary
router.delete('/delete/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;
    
    // Verify the file belongs to the current user
    const userId = req.user.uniqueAppId;
    if (!publicId.startsWith(`chat_files/${userId}/`)) {
      return res.status(403).json({ error: 'Unauthorized to delete this file' });
    }
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    res.json({ 
      message: 'File deleted successfully',
      result 
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get file info
router.get('/info/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const result = await cloudinary.api.resource(publicId);
    
    res.json({
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      createdAt: result.created_at
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

module.exports = router;