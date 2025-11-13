const express = require('express');
const WhatsAppService = require('../services/whatsappService');
const logger = require('../utils/logger');

const router = express.Router();
const whatsAppService = new WhatsAppService();

// Get business profile
router.get('/profile', async (req, res) => {
  try {
    const profile = await whatsAppService.getBusinessProfile();
    
    res.json({
      success: true,
      profile
    });
  } catch (error) {
    logger.error('Error getting business profile', error);
    res.status(500).json({
      error: 'Failed to get business profile',
      details: error.message
    });
  }
});

// Update business profile
router.put('/profile', async (req, res) => {
  try {
    const updates = req.body;
    
    const result = await whatsAppService.updateBusinessProfile(updates);
    
    logger.info('Business profile updated', updates);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error updating business profile', error);
    res.status(500).json({
      error: 'Failed to update business profile',
      details: error.message
    });
  }
});

// Get phone number info
router.get('/phone-info', async (req, res) => {
  try {
    const phoneInfo = await whatsAppService.getPhoneNumberInfo();
    
    res.json({
      success: true,
      phoneInfo
    });
  } catch (error) {
    logger.error('Error getting phone number info', error);
    res.status(500).json({
      error: 'Failed to get phone number info',
      details: error.message
    });
  }
});

// Verify business
router.post('/verify', async (req, res) => {
  try {
    const { businessName, businessDescription, website, email } = req.body;
    
    // This would typically involve calling Meta's business verification APIs
    // For now, we'll log the verification attempt
    logger.info('Business verification requested', {
      businessName,
      businessDescription,
      website,
      email
    });
    
    res.json({
      success: true,
      message: 'Business verification request submitted',
      status: 'pending',
      instructions: [
        '1. Ensure your business is eligible for WhatsApp Business API',
        '2. Complete Facebook Business Manager setup',
        '3. Submit required business documents',
        '4. Wait for Meta review (usually 5-7 business days)',
        '5. Configure your WhatsApp Business profile'
      ]
    });
  } catch (error) {
    logger.error('Error submitting business verification', error);
    res.status(500).json({
      error: 'Failed to submit business verification',
      details: error.message
    });
  }
});

// Get business verification status
router.get('/verification-status', async (req, res) => {
  try {
    // In a real implementation, this would check with Meta's API
    // For now, we'll return a mock status
    res.json({
      success: true,
      verificationStatus: {
        status: 'pending', // pending, approved, rejected
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        nextSteps: [
          'Monitor your email for updates from Meta',
          'Ensure all business documents are valid',
          'Complete any additional requirements if requested'
        ]
      }
    });
  } catch (error) {
    logger.error('Error getting verification status', error);
    res.status(500).json({
      error: 'Failed to get verification status',
      details: error.message
    });
  }
});

// Set up webhook configuration
router.post('/setup-webhook', async (req, res) => {
  try {
    const { webhookUrl, verifyToken, fields = ['messages'] } = req.body;
    
    if (!webhookUrl || !verifyToken) {
      return res.status(400).json({
        error: 'Missing required fields: webhookUrl, verifyToken'
      });
    }
    
    // Store webhook configuration
    logger.info('Webhook setup requested', {
      webhookUrl,
      verifyToken: '***',
      fields
    });
    
    res.json({
      success: true,
      message: 'Webhook configuration saved',
      webhook: {
        url: webhookUrl,
        fields,
        status: 'configured'
      },
      nextSteps: [
        '1. Configure your WhatsApp Business App in Meta Developer Console',
        '2. Add the webhook URL to your app configuration',
        '3. Subscribe to webhook events (messages, message_deliveries)',
        '4. Test the webhook by sending a test message'
      ]
    });
  } catch (error) {
    logger.error('Error setting up webhook', error);
    res.status(500).json({
      error: 'Failed to setup webhook',
      details: error.message
    });
  }
});

// Get message templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await whatsAppService.getMessageTemplates();
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error('Error getting message templates', error);
    res.status(500).json({
      error: 'Failed to get message templates',
      details: error.message
    });
  }
});

// Create message template
router.post('/templates', async (req, res) => {
  try {
    const templateData = req.body;
    
    const result = await whatsAppService.createMessageTemplate(templateData);
    
    logger.info('Message template created', { name: templateData.name });
    
    res.json({
      success: true,
      template: result
    });
  } catch (error) {
    logger.error('Error creating message template', error);
    res.status(500).json({
      error: 'Failed to create message template',
      details: error.message
    });
  }
});

module.exports = router;