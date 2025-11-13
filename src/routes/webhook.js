const express = require('express');
const crypto = require('crypto');
const logger = require('../utils/logger');
const WhatsAppService = require('../services/whatsappService');

const router = express.Router();
const whatsAppService = new WhatsAppService();

// Webhook verification (GET request)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('Webhook verification attempt', { mode, token: token ? '***' : null });

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      logger.info('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      logger.warn('Webhook verification failed - invalid token or mode');
      res.sendStatus(403);
    }
  } else {
    logger.warn('Webhook verification failed - missing parameters');
    res.sendStatus(400);
  }
});

// Webhook event handling (POST request)
router.post('/', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.get('X-Hub-Signature-256');
    if (!verifyWebhookSignature(req.body, signature)) {
      logger.warn('Invalid webhook signature');
      return res.sendStatus(403);
    }

    const body = req.body;
    logger.info('Webhook received', { 
      object: body.object,
      entries: body.entry?.length || 0 
    });

    // Check if this is a WhatsApp Business API webhook
    if (body.object === 'whatsapp_business_account') {
      // Process each entry
      for (const entry of body.entry || []) {
        // Process webhook changes
        for (const change of entry.changes || []) {
          await processWebhookChange(change, entry.id);
        }
      }

      res.status(200).send('EVENT_RECEIVED');
    } else {
      logger.warn('Unexpected webhook object type', { object: body.object });
      res.sendStatus(404);
    }
  } catch (error) {
    logger.error('Error processing webhook', error);
    res.sendStatus(500);
  }
});

// Verify webhook signature for security
function verifyWebhookSignature(payload, signature) {
  if (!signature || !process.env.WHATSAPP_APP_SECRET) {
    return false;
  }

  const expectedSignature = 'sha256=' + 
    crypto
      .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Process individual webhook changes
async function processWebhookChange(change, entryId) {
  const { field, value } = change;
  
  logger.info('Processing webhook change', { 
    field, 
    entryId,
    hasMessages: !!value.messages?.length,
    hasStatuses: !!value.statuses?.length 
  });

  switch (field) {
    case 'messages':
      await processMessages(value, entryId);
      break;
    case 'message_deliveries':
      await processDeliveries(value, entryId);
      break;
    default:
      logger.info('Unhandled webhook field', { field });
  }
}

// Process incoming messages
async function processMessages(messageData, entryId) {
  if (!messageData.messages) return;

  for (const message of messageData.messages) {
    try {
      logger.info('Processing message', {
        messageId: message.id,
        from: message.from,
        type: message.type,
        timestamp: message.timestamp
      });

      // Extract message content based on type
      const messageContent = extractMessageContent(message);
      
      // Process the message with AI if needed
      await whatsAppService.processIncomingMessage({
        id: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: message.type,
        content: messageContent,
        context: message.context || null
      });

    } catch (error) {
      logger.error('Error processing individual message', {
        messageId: message.id,
        error: error.message
      });
    }
  }
}

// Process message delivery statuses
async function processDeliveries(deliveryData, entryId) {
  if (!deliveryData.statuses) return;

  for (const status of deliveryData.statuses) {
    logger.info('Processing delivery status', {
      messageId: status.id,
      status: status.status,
      timestamp: status.timestamp
    });

    // Update message status in your system
    await whatsAppService.updateMessageStatus(status);
  }
}

// Extract content from different message types
function extractMessageContent(message) {
  switch (message.type) {
    case 'text':
      return {
        text: message.text?.body || ''
      };
    case 'image':
      return {
        mediaId: message.image?.id,
        caption: message.image?.caption || '',
        mimeType: message.image?.mime_type
      };
    case 'document':
      return {
        mediaId: message.document?.id,
        filename: message.document?.filename,
        caption: message.document?.caption || '',
        mimeType: message.document?.mime_type
      };
    case 'audio':
      return {
        mediaId: message.audio?.id,
        mimeType: message.audio?.mime_type
      };
    case 'video':
      return {
        mediaId: message.video?.id,
        caption: message.video?.caption || '',
        mimeType: message.video?.mime_type
      };
    case 'location':
      return {
        latitude: message.location?.latitude,
        longitude: message.location?.longitude,
        name: message.location?.name || '',
        address: message.location?.address || ''
      };
    case 'contacts':
      return {
        contacts: message.contacts || []
      };
    case 'interactive':
      return {
        type: message.interactive?.type,
        buttonReply: message.interactive?.button_reply,
        listReply: message.interactive?.list_reply
      };
    default:
      return {};
  }
}

module.exports = router;