const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const logger = require('../utils/logger');

class FileStorageService {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp-storage');
    this.maxFileAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Clean up old files on startup
    this.cleanupOldFiles();
  }

  /**
   * Upload a file to WhatsApp Media API for sending
   * @param {string} filePath - Local file path to upload
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<string>} - Media ID from WhatsApp
   */
  async uploadToWhatsAppMedia(filePath, mimeType = 'application/pdf') {
    try {
      logger.info('Uploading file to WhatsApp Media API', {
        filePath: path.basename(filePath),
        mimeType,
        fileSize: this.getFileSize(filePath)
      });

      if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
        throw new Error('WhatsApp configuration missing');
      }

      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);

      // Create form data
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimeType
      });
      formData.append('type', mimeType);
      formData.append('messaging_product', 'whatsapp');

      // Upload to WhatsApp Media API
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
            ...formData.getHeaders()
          },
          maxContentLength: 100 * 1024 * 1024, // 100MB limit
          maxBodyLength: 100 * 1024 * 1024
        }
      );

      const mediaId = response.data.id;

      logger.info('File uploaded to WhatsApp Media API successfully', {
        mediaId,
        fileName,
        fileSize: this.getFileSize(filePath)
      });

      return mediaId;

    } catch (error) {
      logger.error('Error uploading file to WhatsApp Media API', {
        error: error.response?.data || error.message,
        filePath: path.basename(filePath),
        mimeType
      });
      throw error;
    }
  }

  /**
   * Store file temporarily with metadata
   * @param {string} filePath - Source file path
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} - Stored file info
   */
  async storeTemporarily(filePath, metadata = {}) {
    try {
      const fileName = path.basename(filePath);
      const timestamp = Date.now();
      const storedFileName = `${timestamp}-${fileName}`;
      const storedPath = path.join(this.tempDir, storedFileName);

      // Copy file to temp storage
      fs.copyFileSync(filePath, storedPath);

      // Create metadata file
      const metadataPath = path.join(this.tempDir, `${storedFileName}.meta.json`);
      const fileInfo = {
        originalPath: filePath,
        storedPath: storedPath,
        fileName: fileName,
        storedFileName: storedFileName,
        timestamp: timestamp,
        fileSize: this.getFileSize(filePath),
        metadata: metadata,
        expiresAt: timestamp + this.maxFileAge
      };

      fs.writeFileSync(metadataPath, JSON.stringify(fileInfo, null, 2));

      logger.info('File stored temporarily', {
        fileName,
        storedFileName,
        fileSize: fileInfo.fileSize,
        expiresAt: new Date(fileInfo.expiresAt).toISOString()
      });

      return fileInfo;

    } catch (error) {
      logger.error('Error storing file temporarily', {
        error: error.message,
        filePath
      });
      throw error;
    }
  }

  /**
   * Upload file to external storage (S3/Supabase/etc.)
   * This is a placeholder for external storage integration
   * @param {string} filePath - Local file path
   * @param {string} fileName - Desired filename
   * @returns {Promise<string>} - Public URL of uploaded file
   */
  async uploadToExternalStorage(filePath, fileName = null) {
    try {
      // For now, return a local storage URL
      // In production, implement actual cloud storage (S3, Supabase, etc.)
      
      const baseFileName = fileName || path.basename(filePath);
      const storedFile = await this.storeTemporarily(filePath, { 
        uploadedAt: new Date().toISOString(),
        type: 'external_upload'
      });

      // Generate a temporary public URL (in production, use actual cloud storage URL)
      const publicUrl = `http://localhost:${process.env.PORT || 3000}/api/files/temp/${storedFile.storedFileName}`;

      logger.info('File uploaded to external storage', {
        fileName: baseFileName,
        publicUrl,
        fileSize: storedFile.fileSize
      });

      return publicUrl;

    } catch (error) {
      logger.error('Error uploading to external storage', {
        error: error.message,
        filePath,
        fileName
      });
      throw error;
    }
  }

  /**
   * Get file from temporary storage
   * @param {string} storedFileName - Stored filename
   * @returns {Object|null} - File info or null if not found
   */
  getStoredFile(storedFileName) {
    try {
      const metadataPath = path.join(this.tempDir, `${storedFileName}.meta.json`);
      
      if (!fs.existsSync(metadataPath)) {
        return null;
      }

      const fileInfo = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      // Check if file has expired
      if (Date.now() > fileInfo.expiresAt) {
        this.deleteStoredFile(storedFileName);
        return null;
      }

      // Check if file still exists
      if (!fs.existsSync(fileInfo.storedPath)) {
        this.deleteStoredFile(storedFileName);
        return null;
      }

      return fileInfo;

    } catch (error) {
      logger.error('Error getting stored file', {
        error: error.message,
        storedFileName
      });
      return null;
    }
  }

  /**
   * Delete stored file and metadata
   * @param {string} storedFileName - Stored filename
   */
  deleteStoredFile(storedFileName) {
    try {
      const metadataPath = path.join(this.tempDir, `${storedFileName}.meta.json`);
      const filePath = path.join(this.tempDir, storedFileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
      }

      logger.info('Stored file deleted', { storedFileName });

    } catch (error) {
      logger.error('Error deleting stored file', {
        error: error.message,
        storedFileName
      });
    }
  }

  /**
   * Clean up expired files
   */
  async cleanupOldFiles() {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.meta.json')) {
          const metadataPath = path.join(this.tempDir, file);
          const storedFileName = file.replace('.meta.json', '');

          try {
            const fileInfo = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            
            if (now > fileInfo.expiresAt) {
              this.deleteStoredFile(storedFileName);
              deletedCount++;
            }
          } catch (parseError) {
            // Delete corrupted metadata files
            this.deleteStoredFile(storedFileName);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        logger.info('Cleaned up expired files', { deletedCount });
      }

    } catch (error) {
      logger.error('Error during file cleanup', {
        error: error.message
      });
    }
  }

  /**
   * Get file size in human readable format
   * @param {string} filePath - Path to file
   * @returns {string} - Human readable file size
   */
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const bytes = stats.size;
      
      if (bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    } catch (error) {
      return 'Unknown size';
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} - Storage statistics
   */
  getStorageStats() {
    try {
      const files = fs.readdirSync(this.tempDir);
      let totalFiles = 0;
      let totalSize = 0;
      let validFiles = 0;

      for (const file of files) {
        if (!file.endsWith('.meta.json')) {
          const filePath = path.join(this.tempDir, file);
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            totalFiles++;
            totalSize += stats.size;

            // Check if it has valid metadata
            const metadataPath = path.join(this.tempDir, `${file}.meta.json`);
            if (fs.existsSync(metadataPath)) {
              validFiles++;
            }
          }
        }
      }

      return {
        totalFiles,
        validFiles,
        totalSize,
        humanTotalSize: this.formatBytes(totalSize),
        tempDirectory: this.tempDir
      };

    } catch (error) {
      logger.error('Error getting storage stats', error);
      return {
        totalFiles: 0,
        validFiles: 0,
        totalSize: 0,
        humanTotalSize: '0 B',
        tempDirectory: this.tempDir
      };
    }
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes - Bytes to format
   * @returns {string} - Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

module.exports = FileStorageService;