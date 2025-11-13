const express = require('express');
const path = require('path');
const FileStorageService = require('../services/fileStorageService');
const logger = require('../utils/logger');

const router = express.Router();
const fileStorage = new FileStorageService();

// Serve temporary files
router.get('/temp/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const fileInfo = fileStorage.getStoredFile(filename);

    if (!fileInfo) {
      logger.warn('Temporary file not found', { filename });
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file does not exist or has expired'
      });
    }

    logger.info('Serving temporary file', {
      filename,
      originalName: fileInfo.fileName,
      fileSize: fileInfo.fileSize
    });

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send file
    res.sendFile(fileInfo.storedPath);

  } catch (error) {
    logger.error('Error serving temporary file', {
      filename: req.params.filename,
      error: error.message
    });

    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to serve the requested file'
    });
  }
});

// Get file storage statistics
router.get('/storage/stats', (req, res) => {
  try {
    const stats = fileStorage.getStorageStats();
    
    logger.info('File storage stats requested', stats);
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting storage stats', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to retrieve storage statistics'
    });
  }
});

// Clean up expired files (admin endpoint)
router.post('/storage/cleanup', async (req, res) => {
  try {
    logger.info('Manual cleanup requested');
    
    await fileStorage.cleanupOldFiles();
    const stats = fileStorage.getStorageStats();
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      storageStats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error during manual cleanup', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Cleanup operation failed'
    });
  }
});

module.exports = router;