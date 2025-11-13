const express = require('express');
const WhatsAppService = require('../services/whatsappService');
const logger = require('../utils/logger');

const router = express.Router();
const whatsAppService = new WhatsAppService();

// Send a text message
router.post('/send-text', async (req, res) => {
  try {
    const { to, message, previewUrl = false } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        error: 'Missing required fields: to, message'
      });
    }

    const result = await whatsAppService.sendTextMessage(to, message, previewUrl);
    
    logger.info('Text message sent', { to, messageId: result.messages[0].id });
    
    res.json({
      success: true,
      messageId: result.messages[0].id,
      data: result
    });
  } catch (error) {
    logger.error('Error sending text message', error);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message
    });
  }
});

// Send a template message
router.post('/send-template', async (req, res) => {
  try {
    const { to, templateName, language = 'en_US', components } = req.body;

    if (!to || !templateName) {
      return res.status(400).json({
        error: 'Missing required fields: to, templateName'
      });
    }

    const result = await whatsAppService.sendTemplateMessage(to, templateName, language, components);
    
    logger.info('Template message sent', { to, templateName, messageId: result.messages[0].id });
    
    res.json({
      success: true,
      messageId: result.messages[0].id,
      data: result
    });
  } catch (error) {
    logger.error('Error sending template message', error);
    res.status(500).json({
      error: 'Failed to send template message',
      details: error.message
    });
  }
});

// Send media message
router.post('/send-media', async (req, res) => {
  try {
    const { to, type, mediaId, caption, filename } = req.body;

    if (!to || !type || !mediaId) {
      return res.status(400).json({
        error: 'Missing required fields: to, type, mediaId'
      });
    }

    const result = await whatsAppService.sendMediaMessage(to, type, mediaId, caption, filename);
    
    logger.info('Media message sent', { to, type, messageId: result.messages[0].id });
    
    res.json({
      success: true,
      messageId: result.messages[0].id,
      data: result
    });
  } catch (error) {
    logger.error('Error sending media message', error);
    res.status(500).json({
      error: 'Failed to send media message',
      details: error.message
    });
  }
});

// Send interactive message (buttons/list)
router.post('/send-interactive', async (req, res) => {
  try {
    const { to, type, header, body, footer, action } = req.body;

    if (!to || !type || !body || !action) {
      return res.status(400).json({
        error: 'Missing required fields: to, type, body, action'
      });
    }

    const result = await whatsAppService.sendInteractiveMessage(to, type, {
      header,
      body,
      footer,
      action
    });
    
    logger.info('Interactive message sent', { to, type, messageId: result.messages[0].id });
    
    res.json({
      success: true,
      messageId: result.messages[0].id,
      data: result
    });
  } catch (error) {
    logger.error('Error sending interactive message', error);
    res.status(500).json({
      error: 'Failed to send interactive message',
      details: error.message
    });
  }
});

// Mark message as read
router.post('/mark-read', async (req, res) => {
  try {
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({
        error: 'Missing required field: messageId'
      });
    }

    const result = await whatsAppService.markMessageAsRead(messageId);
    
    logger.info('Message marked as read', { messageId });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error marking message as read', error);
    res.status(500).json({
      error: 'Failed to mark message as read',
      details: error.message
    });
  }
});

// Get media URL
router.get('/media/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    
    const mediaUrl = await whatsAppService.getMediaUrl(mediaId);
    
    res.json({
      success: true,
      mediaId,
      url: mediaUrl
    });
  } catch (error) {
    logger.error('Error getting media URL', error);
    res.status(500).json({
      error: 'Failed to get media URL',
      details: error.message
    });
  }
});

// Upload media
router.post('/upload-media', async (req, res) => {
  try {
    const { type, url, filename } = req.body;

    if (!type || !url) {
      return res.status(400).json({
        error: 'Missing required fields: type, url'
      });
    }

    const result = await whatsAppService.uploadMedia(type, url, filename);
    
    logger.info('Media uploaded', { type, mediaId: result.id });
    
    res.json({
      success: true,
      mediaId: result.id,
      data: result
    });
  } catch (error) {
    logger.error('Error uploading media', error);
    res.status(500).json({
      error: 'Failed to upload media',
      details: error.message
    });
  }
});

module.exports = router;