const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const PDFGeneratorService = require('./pdfGeneratorService');
const FileStorageService = require('./fileStorageService');
const ConversationTracker = require('./conversationTracker');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    
    // Create downloads directory if it doesn't exist
    this.downloadsDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
    }
    
    // Initialize services
    this.pdfGenerator = new PDFGeneratorService();
    this.fileStorage = new FileStorageService();
    this.conversationTracker = new ConversationTracker();
    
    // Validate required configuration
    if (!this.accessToken || !this.phoneNumberId) {
      logger.warn('WhatsApp configuration incomplete. Check WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
    }
  }

  // Get API headers
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Send a text message
  async sendTextMessage(to, text, previewUrl = false) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: previewUrl,
          body: text
        }
      };

      const response = await axios.post(url, payload, { headers: this.getHeaders() });
      
      logger.info('Text message sent successfully', {
        to,
        messageId: response.data.messages[0].id
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send text message', {
        to,
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Send a template message
  async sendTemplateMessage(to, templateName, language = 'en_US', components = []) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: language
          },
          components: components
        }
      };

      const response = await axios.post(url, payload, { headers: this.getHeaders() });
      
      logger.info('Template message sent successfully', {
        to,
        templateName,
        messageId: response.data.messages[0].id
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send template message', {
        to,
        templateName,
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Send media message (image, video, audio, document)
  async sendMediaMessage(to, mediaType, mediaId, caption = null, filename = null) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const mediaObject = {
        id: mediaId
      };
      
      if (caption) mediaObject.caption = caption;
      if (filename && mediaType === 'document') mediaObject.filename = filename;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: mediaType,
        [mediaType]: mediaObject
      };

      const response = await axios.post(url, payload, { headers: this.getHeaders() });
      
      logger.info('Media message sent successfully', {
        to,
        mediaType,
        messageId: response.data.messages[0].id
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send media message', {
        to,
        mediaType,
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Send interactive message (buttons or list)
  async sendInteractiveMessage(to, interactiveType, interactive) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: {
          type: interactiveType,
          ...interactive
        }
      };

      const response = await axios.post(url, payload, { headers: this.getHeaders() });
      
      logger.info('Interactive message sent successfully', {
        to,
        interactiveType,
        messageId: response.data.messages[0].id
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send interactive message', {
        to,
        interactiveType,
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      };

      const response = await axios.post(url, payload, { headers: this.getHeaders() });
      
      logger.info('Message marked as read', { messageId });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to mark message as read', {
        messageId,
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Get media URL
  async getMediaUrl(mediaId) {
    try {
      const url = `${this.apiUrl}/${mediaId}`;
      
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      return response.data.url;
    } catch (error) {
      logger.error('Failed to get media URL', {
        mediaId,
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Download media file
  async downloadMedia(mediaId, filename) {
    try {
      // Get the media URL first
      const mediaUrl = await this.getMediaUrl(mediaId);
      
      // Download the file
      const response = await axios.get(mediaUrl, {
        responseType: 'stream',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      // Create file path
      const filePath = path.join(this.downloadsDir, filename || `${mediaId}_${Date.now()}.file`);
      
      // Save file to disk
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          logger.info('Media file downloaded successfully', {
            mediaId,
            filePath,
            filename
          });
          resolve(filePath);
        });
        writer.on('error', reject);
      });

    } catch (error) {
      logger.error('Failed to download media', {
        mediaId,
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Process file with AI (enhanced with document-type-specific analysis)
  async processFileWithAI(filePath, messageType, analysisType = 'general', userId = null) {
    try {
      logger.info('Processing file with AI', { 
        filePath, 
        messageType, 
        analysisType,
        userId 
      });
      
      // Read file content based on type
      let extractedContent = '';
      
      if (messageType === 'document') {
        // Handle PDF/document extraction
        extractedContent = await this.extractTextFromDocument(filePath);
      } else if (messageType === 'image') {
        // Handle image text extraction (OCR)
        extractedContent = await this.extractTextFromImage(filePath);
      } else {
        logger.warn('Unsupported file type for AI processing', { messageType });
        return { error: 'Unsupported file type for AI processing' };
      }

      if (!extractedContent || extractedContent.trim().length < 10) {
        return { error: 'Could not extract meaningful text from the document' };
      }

      // Process with document-type-specific AI analysis
      const improvedContent = await this.performDocumentSpecificAnalysis(
        extractedContent, 
        analysisType, 
        userId
      );
      
      return improvedContent;

    } catch (error) {
      logger.error('Error processing file with AI', {
        filePath,
        error: error.message
      });
      return { error: error.message };
    }
  }

  // Extract text from documents (PDF, DOC, etc.)
  async extractTextFromDocument(filePath) {
    try {
      logger.info('Extracting text from document', { filePath });
      
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (fileExtension === '.pdf') {
        // Extract text from PDF
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        
        logger.info('PDF text extraction successful', {
          filePath,
          textLength: pdfData.text.length,
          pages: pdfData.numpages
        });
        
        return pdfData.text;
      } else if (fileExtension === '.txt' || fileExtension === '.md') {
        // Extract text from plain text files
        const textContent = fs.readFileSync(filePath, 'utf8');
        
        logger.info('Text file extraction successful', {
          filePath,
          textLength: textContent.length
        });
        
        return textContent;
      } else {
        // For other document types, return a placeholder
        logger.warn('Unsupported document type for text extraction', { fileExtension });
        return `Document content from ${path.basename(filePath)} (${fileExtension} format not supported for text extraction)`;
      }
      
    } catch (error) {
      logger.error('Error extracting text from document', {
        filePath,
        error: error.message
      });
      return `Error extracting text from ${path.basename(filePath)}`;
    }
  }

  // Extract text from images (OCR)
  async extractTextFromImage(filePath) {
    try {
      logger.info('Extracting text from image using OCR', { filePath });
      
      const worker = createWorker('eng');
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const { data: { text, confidence } } = await worker.recognize(filePath);
      await worker.terminate();
      
      logger.info('OCR extraction successful', {
        filePath,
        textLength: text.length,
        confidence: confidence.toFixed(2)
      });
      
      if (text.trim().length === 0) {
        return `No text detected in image ${path.basename(filePath)}`;
      }
      
      return text.trim();
      
    } catch (error) {
      logger.error('Error extracting text from image', {
        filePath,
        error: error.message
      });
      return `Error extracting text from image ${path.basename(filePath)}`;
    }
  }

  // Process incoming messages with AI capabilities
  async processIncomingMessage(messageData) {
    try {
      const { id, from, timestamp, type, content, context } = messageData;
      
      logger.info('Processing incoming message', {
        messageId: id,
        from,
        type,
        hasContent: !!content
      });

      // Handle media messages (documents, images) with AI processing
      if ((type === 'document' || type === 'image') && content.mediaId) {
        await this.handleMediaMessage(messageData);
      }
      // Handle text messages
      else if (type === 'text' && content.text) {
        await this.handleTextMessage(messageData);
      }
      // Handle other message types
      else {
        await this.handleOtherMessage(messageData);
      }

    } catch (error) {
      logger.error('Error processing incoming message', {
        messageId: messageData.id,
        error: error.message
      });
      
      // Send error message to user
      await this.sendMessage(
        messageData.from,
        '❌ Sorry, I encountered an error while processing your message. Please try again.'
      );
    }
  }

  // Handle media messages with AI processing
  async handleMediaMessage(messageData) {
    const { from, type, content } = messageData;
    
    try {
      logger.info('Processing media message with AI', {
        messageType: type,
        from,
        mediaId: content.mediaId,
        filename: content.filename
      });

      // Check if user is opted out
      if (this.conversationTracker.isUserOptedOut(from)) {
        logger.info('Ignoring media from opted-out user', { from });
        return;
      }

      // Update conversation tracking
      this.conversationTracker.updateUserActivity(from, 'document');
      this.conversationTracker.incrementDocumentCount(from);

      // Get user preferences for document type-specific processing
      const userData = this.conversationTracker.getOrCreateUser(from);
      const isAwaitingDocument = userData.awaitingDocument;
      const expectedDocumentType = userData.awaitingDocumentType;

      // Clear awaiting status
      this.conversationTracker.setAwaitingDocument(from, false);

      // Add to conversation history
      this.conversationTracker.addToHistory(from, {
        type: 'document',
        content: `${type} document: ${content.filename || 'unnamed'}`,
        direction: 'incoming',
        documentType: expectedDocumentType
      });

      // Send initial acknowledgment with document type info
      let initialMessage = `📄 *Processing your document...*\n\n🔄 Analyzing content and extracting insights`;
      if (expectedDocumentType) {
        initialMessage += `\n📝 Document type: ${this.getDocumentTypeDisplayName(expectedDocumentType)}`;
      }
      initialMessage += `\n⏱️ This may take a moment`;
      
      await this.sendMessage(from, initialMessage);

      // Download the media file
      const filename = content.filename || `${content.mediaId}_${Date.now()}`;
      const filePath = await this.downloadMedia(content.mediaId, filename);
      
      // Process with document-type-specific AI analysis
      let analysisType = expectedDocumentType || 'general';
      const aiResult = await this.processFileWithAI(filePath, type, analysisType, from);
      
      if (aiResult && !aiResult.error) {
        // Send initial text response with analysis results
        let responseMessage = `✅ *Document Analysis Complete*\n\n`;
        
        if (content.filename) {
          responseMessage += `📁 *File:* ${content.filename}\n\n`;
        }

        // Add document-type-specific summary
        if (analysisType !== 'general') {
          responseMessage += `🎯 *Analysis Type:* ${this.getDocumentTypeDisplayName(analysisType)}\n\n`;
        }
        
        if (aiResult.summary) {
          responseMessage += `📋 *Key Findings:*\n${aiResult.summary}\n\n`;
        }
        
        if (aiResult.keyPoints && aiResult.keyPoints.length > 0) {
          responseMessage += `🔑 *Important Points:*\n`;
          aiResult.keyPoints.slice(0, 3).forEach((point, index) => {
            responseMessage += `${index + 1}. ${point}\n`;
          });
          responseMessage += '\n';
        }
        
        if (aiResult.actionItems && aiResult.actionItems.length > 0) {
          responseMessage += `✅ *Recommendations:*\n`;
          aiResult.actionItems.slice(0, 2).forEach((item, index) => {
            responseMessage += `${index + 1}. ${item}\n`;
          });
          responseMessage += '\n';
        }
        
        responseMessage += `📊 *Document Stats:* ${aiResult.metadata?.wordCount || 'N/A'} words, `;
        responseMessage += `${aiResult.metadata?.estimatedReadTime || 'N/A'} min read\n\n`;
        responseMessage += `📄 *Generating professional PDF report...*`;
        
        await this.sendMessage(from, responseMessage);
        
        // Generate and send document-type-specific PDF report
        try {
          await this.generateAndSendPDFReport(from, aiResult, filename, analysisType);
          
          // Update conversation tracking for PDF generation
          this.conversationTracker.incrementPDFCount(from);
          this.conversationTracker.addToHistory(from, {
            type: 'pdf_report',
            content: aiResult.title || `${analysisType} analysis report`,
            direction: 'outgoing',
            documentType: analysisType
          });

          // Send follow-up actions based on document type
          await this.sendFollowUpActions(from, analysisType);
          
        } catch (pdfError) {
          logger.error('PDF generation failed, sending text summary only', {
            error: pdfError.message,
            from,
            filename
          });
          
          await this.sendMessage(from, 
            `📄 *PDF Report Generation Failed*\n\n` +
            `✅ AI analysis completed successfully\n` +
            `❌ Could not generate PDF report\n` +
            `📱 Text summary provided above\n\n` +
            `Please try again or contact support if the issue persists.`
          );
          
          // Still show follow-up actions even if PDF failed
          await this.sendFollowUpActions(from, analysisType);
        }
        
        logger.info('Document processing completed successfully', {
          from,
          originalFile: filename,
          analysisType,
          processingResult: 'success',
          pdfGenerated: true
        });
        
      } else {
        // Fallback if AI processing fails
        await this.sendMessage(
          from, 
          `📄 *Processing Error*\n\n` +
          `✅ File received: ${filename}\n` +
          `❌ AI analysis failed: ${aiResult?.error || 'Unknown error'}\n\n` +
          `💡 Please try:\n` +
          `• Ensuring the file contains readable text\n` +
          `• Using PDF, TXT, or clear image formats\n` +
          `• Checking file size is reasonable\n\n` +
          `🔧 Try again or contact support if issues persist.`
        );
        
        // Still offer quick replies even on failure
        await this.sendDocumentTypeQuickReplies(from, false);
      }
      
    } catch (error) {
      logger.error('Error handling media message', {
        error: error.message,
        from,
        messageType: type
      });
      
      // Send error message to user
      await this.sendMessage(
        from, 
        `❌ *Processing Error*\n\n` +
        `Sorry, I encountered an error while processing your file.\n\n` +
        `Error: ${error.message}\n\n` +
        `Please try again or contact support if the issue persists.`
      );
      
      // Offer quick replies to continue
      await this.sendDocumentTypeQuickReplies(from, false);
    }
  }

  // Handle text messages
  async handleTextMessage(messageData) {
    const { from, content, context } = messageData;
    const messageText = content.text.toLowerCase();

    try {
      logger.info('Processing text message', {
        from,
        messageLength: content.text.length,
        hasContext: !!context
      });

      // Check if user is opted out
      if (this.conversationTracker.isUserOptedOut(from)) {
        // Only respond to opt-in requests
        if (messageText.includes('start') || messageText.includes('optin')) {
          this.conversationTracker.optInUser(from);
          await this.sendMessage(from, 
            `🎉 *Welcome back!*\n\n` +
            `You've successfully opted back into our AI document assistant service.\n\n` +
            `Send me a document or use the commands below to get started!`
          );
          await this.sendDocumentTypeQuickReplies(from, true);
          return;
        }
        // Ignore all other messages from opted-out users
        logger.info('Ignoring message from opted-out user', { from });
        return;
      }

      // Update user activity
      this.conversationTracker.updateUserActivity(from, 'text');
      this.conversationTracker.addToHistory(from, {
        type: 'text',
        content: content.text,
        direction: 'incoming'
      });

      // Handle STOP command (opt-out)
      if (messageText === 'stop' || messageText === 'unsubscribe' || messageText === 'opt out') {
        this.conversationTracker.optOutUser(from);
        await this.sendMessage(from, 
          `✋ *You've been opted out*\n\n` +
          `You will no longer receive messages from our AI document assistant.\n\n` +
          `To opt back in, simply send "START" anytime.\n\n` +
          `Thank you for using our service! 🙏`
        );
        return;
      }

      // Get user data for personalized responses
      const userData = this.conversationTracker.getOrCreateUser(from);
      const isFirstTime = userData.messageCount <= 1;

      // Handle interactive button responses
      if (content.text === '📝 Improve CV' || messageText.includes('cv') || messageText.includes('resume')) {
        this.conversationTracker.setDocumentTypePreference(from, 'cv');
        this.conversationTracker.setAwaitingDocument(from, true, 'cv');
        
        await this.sendMessage(from,
          `📝 *CV/Resume Analysis*\n\n` +
          `Perfect! I'll help you improve your CV/Resume with:\n\n` +
          `✅ Content optimization suggestions\n` +
          `✅ ATS (Applicant Tracking System) compatibility check\n` +
          `✅ Professional formatting recommendations\n` +
          `✅ Skill highlighting and keyword optimization\n\n` +
          `📄 Please upload your CV/Resume document (PDF, DOC, or TXT format)`
        );
        return;
      }

      if (content.text === '📄 Cover Letter' || messageText.includes('cover letter')) {
        this.conversationTracker.setDocumentTypePreference(from, 'cover-letter');
        this.conversationTracker.setAwaitingDocument(from, true, 'cover-letter');
        
        await this.sendMessage(from,
          `📄 *Cover Letter Analysis*\n\n` +
          `Great choice! I'll help you enhance your cover letter with:\n\n` +
          `✅ Personalization and targeting improvements\n` +
          `✅ Professional tone and structure analysis\n` +
          `✅ Achievement highlighting techniques\n` +
          `✅ Company research integration tips\n\n` +
          `� Please upload your cover letter document`
        );
        return;
      }

      if (content.text === '🎯 ATS Score' || messageText.includes('ats')) {
        this.conversationTracker.setDocumentTypePreference(from, 'ats-score');
        this.conversationTracker.setAwaitingDocument(from, true, 'ats-score');
        
        await this.sendMessage(from,
          `🎯 *ATS Compatibility Score*\n\n` +
          `Excellent! I'll analyze your document for ATS compatibility:\n\n` +
          `🔍 Keyword density and relevance\n` +
          `📊 Format and structure scoring\n` +
          `📈 Readability and parsing analysis\n` +
          `🎯 Specific improvement recommendations\n\n` +
          `📄 Upload your document to get your ATS score!`
        );
        return;
      }

      // Handle other quick reply actions
      if (content.text === '📄 Another Document') {
        await this.sendDocumentTypeQuickReplies(from, false);
        return;
      }

      if (content.text === '📊 My Stats') {
        const userStats = this.conversationTracker.getUserStats(from);
        await this.sendMessage(from,
          `📊 *Your Usage Statistics*\n\n` +
          `� User since: ${new Date(userStats.firstMessage).toLocaleDateString()}\n` +
          `💬 Total messages: ${userStats.messageCount}\n` +
          `📄 Documents processed: ${userStats.documentCount}\n` +
          `📋 PDFs generated: ${userStats.pdfCount}\n` +
          `📈 Days active: ${userStats.daysSinceFirstMessage}\n` +
          `🎯 Preferred type: ${userStats.preferredDocumentType || 'Not set'}\n\n` +
          `Thank you for using our service! 🚀`
        );
        return;
      }

      // Handle help command
      if (messageText.includes('help') || content.text === '❓ Help') {
        await this.sendMessage(from, 
          `🤖 *AI Document Assistant Help*\n\n` +
          `📄 *What I can do:*\n` +
          `• Analyze CVs/Resumes for improvement\n` +
          `• Enhance cover letters for better impact\n` +
          `• Score documents for ATS compatibility\n` +
          `• Generate professional PDF reports\n\n` +
          `📱 *Quick Commands:*\n` +
          `• "CV" - CV/Resume analysis\n` +
          `• "Cover Letter" - Cover letter help\n` +
          `• "ATS" - ATS compatibility scoring\n` +
          `• "Stats" - Your usage statistics\n` +
          `• "STOP" - Opt out of service\n\n` +
          `💡 *Pro tip:* Use the quick reply buttons for faster navigation!`
        );
        
        if (!isFirstTime) {
          await this.sendDocumentTypeQuickReplies(from, false);
        }
        return;
      }

      // Handle status command
      if (messageText.includes('status')) {
        const serviceStats = this.conversationTracker.getServiceStats();
        await this.sendMessage(from,
          `🟢 *Bot Status: Online*\n\n` +
          `✅ Ready to process documents\n` +
          `✅ AI analysis operational\n` +
          `✅ PDF generation enabled\n` +
          `✅ Conversation tracking active\n\n` +
          `📊 *Service Statistics:*\n` +
          `• Total users: ${serviceStats.totalUsers}\n` +
          `• Active users (24h): ${serviceStats.activeUsers}\n` +
          `• Documents processed: ${serviceStats.totalDocuments}\n` +
          `• PDFs generated: ${serviceStats.totalPDFs}`
        );
        return;
      }

      // First time user - show welcome and quick replies
      if (isFirstTime) {
        await this.sendMessage(from,
          `🎉 *Welcome to AI Document Assistant!*\n\n` +
          `I'm here to help you improve your professional documents with AI-powered analysis.\n\n` +
          `What I can help you with:\n` +
          `📝 CV/Resume optimization\n` +
          `📄 Cover letter enhancement\n` +
          `🎯 ATS compatibility scoring\n\n` +
          `Let's get started! 🚀`
        );
        
        await this.sendDocumentTypeQuickReplies(from, true);
        return;
      }

      // Default response for existing users
      await this.sendMessage(from, 
        `� Message received: "${content.text}"\n\n` +
        `💡 I'm specialized in document analysis! Use the quick replies below or send:\n` +
        `• "CV" for resume help\n` +
        `• "Cover Letter" for cover letter tips\n` +
        `• "ATS" for compatibility scoring\n` +
        `• "Help" for more information`
      );
      
      await this.sendDocumentTypeQuickReplies(from, false);

    } catch (error) {
      logger.error('Error handling text message', {
        error: error.message,
        from
      });
      
      await this.sendMessage(from,
        `❌ Sorry, I encountered an error processing your message. Please try again or contact support.`
      );
    }
  }

  // Handle other message types
  async handleOtherMessage(messageData) {
    const { from, type } = messageData;
    
    logger.info('Received unsupported message type', {
      from,
      type
    });

    await this.sendMessage(from,
      `📱 Received ${type} message.\n\n` +
      `🤖 I currently support:\n` +
      `   • Text messages\n` +
      `   • Documents (PDF, DOC, etc.)\n` +
      `   • Images\n\n` +
      `Please send a document or image for AI processing!`
    );
  }

  // Update message status (for delivery tracking)
  async updateMessageStatus(statusData) {
    logger.info('Message status update', {
      messageId: statusData.id,
      status: statusData.status,
      timestamp: statusData.timestamp,
      recipientId: statusData.recipient_id
    });

    // TODO: Update message status in your database
    // This is useful for tracking message delivery, read receipts, etc.
  }

  // Upload media
  async uploadMedia(type, fileUrl, filename) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/media`;
      
      const payload = {
        messaging_product: 'whatsapp',
        type: type,
        url: fileUrl
      };
      
      if (filename) {
        payload.filename = filename;
      }

      const response = await axios.post(url, payload, { headers: this.getHeaders() });
      
      logger.info('Media uploaded successfully', {
        type,
        mediaId: response.data.id
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to upload media', {
        type,
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Get business profile
  async getBusinessProfile() {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/whatsapp_business_profile`;
      
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      return response.data.data[0];
    } catch (error) {
      logger.error('Failed to get business profile', {
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Update business profile
  async updateBusinessProfile(updates) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/whatsapp_business_profile`;
      
      const payload = {
        messaging_product: 'whatsapp',
        ...updates
      };

      const response = await axios.post(url, payload, { headers: this.getHeaders() });
      
      logger.info('Business profile updated', updates);
      
      return response.data;
    } catch (error) {
      logger.error('Failed to update business profile', {
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Get phone number info
  async getPhoneNumberInfo() {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}`;
      
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get phone number info', {
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Get message templates
  async getMessageTemplates() {
    try {
      const url = `${this.apiUrl}/${this.businessAccountId}/message_templates`;
      
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get message templates', {
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Create message template
  async createMessageTemplate(templateData) {
    try {
      const url = `${this.apiUrl}/${this.businessAccountId}/message_templates`;
      
      const response = await axios.post(url, templateData, { headers: this.getHeaders() });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to create message template', {
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Process incoming message (implement your business logic here)
  async processIncomingMessage(message) {
    try {
      logger.info('Processing incoming message', {
        messageId: message.id,
        from: message.from,
        type: message.type
      });

      // Implement your message processing logic here
      // For example:
      
      if (message.type === 'text') {
        const userMessage = message.content.text.toLowerCase();
        
        // Simple echo bot for demonstration
        if (userMessage.includes('hello') || userMessage.includes('hi')) {
          await this.sendTextMessage(
            message.from,
            `Hello! Thanks for messaging us. How can we help you today?`
          );
        } else if (userMessage.includes('help')) {
          await this.sendTextMessage(
            message.from,
            `Here are some things I can help you with:\n• General information\n• Product inquiries\n• Support requests\n\nJust send me a message!`
          );
        } else {
          await this.sendTextMessage(
            message.from,
            `Thanks for your message: "${message.content.text}". We'll get back to you soon!`
          );
        }
      }

      // Mark the message as read
      await this.markMessageAsRead(message.id);
      
    } catch (error) {
      logger.error('Error processing incoming message', {
        messageId: message.id,
        error: error.message
      });
    }
  }

  // Update message status (delivery, read, etc.)
  async updateMessageStatus(status) {
    try {
      logger.info('Message status updated', {
        messageId: status.id,
        status: status.status,
        timestamp: status.timestamp
      });
      
      // Implement your status update logic here
      // For example, update your database with delivery status
      
    } catch (error) {
      logger.error('Error updating message status', {
        statusId: status.id,
        error: error.message
      });
    }
  }

  // Send document message
  async sendDocument(to, mediaId, filename = null, caption = null) {
    try {
      const messageData = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'document',
        document: {
          id: mediaId
        }
      };

      if (filename) {
        messageData.document.filename = filename;
      }

      if (caption) {
        messageData.document.caption = caption;
      }

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        messageData,
        { headers: this.getHeaders() }
      );

      logger.info('Document message sent successfully', {
        to,
        mediaId,
        filename,
        messageId: response.data.messages[0].id
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send document message', {
        to,
        mediaId,
        filename,
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Send document from local file path
  async sendDocumentFromFile(to, filePath, caption = null) {
    try {
      logger.info('Preparing to send document from file', {
        to,
        filePath: path.basename(filePath),
        caption
      });

      // Upload file to WhatsApp Media API
      const mediaId = await this.fileStorage.uploadToWhatsAppMedia(filePath, 'application/pdf');
      
      // Send document message
      const filename = path.basename(filePath);
      const result = await this.sendDocument(to, mediaId, filename, caption);

      logger.info('Document sent from file successfully', {
        to,
        filename,
        mediaId,
        messageId: result.messages[0].id
      });

      return result;

    } catch (error) {
      logger.error('Failed to send document from file', {
        to,
        filePath: path.basename(filePath),
        error: error.message
      });
      throw error;
    }
  }

  // Send interactive button message
  async sendInteractiveButtons(to, headerText, bodyText, footerText, buttons) {
    try {
      const messageData = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          header: {
            type: 'text',
            text: headerText
          },
          body: {
            text: bodyText
          },
          footer: {
            text: footerText
          },
          action: {
            buttons: buttons
          }
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        messageData,
        { headers: this.getHeaders() }
      );

      logger.info('Interactive button message sent successfully', {
        to,
        buttonsCount: buttons.length,
        messageId: response.data.messages[0].id
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send interactive button message', {
        to,
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  // Send quick reply buttons for document types
  async sendDocumentTypeQuickReplies(to, isFirstTime = true) {
    const headerText = isFirstTime ? "👋 Welcome to AI Document Assistant!" : "📄 What type of document?";
    
    const bodyText = isFirstTime 
      ? "I can help you analyze and improve your professional documents. What would you like me to help you with today?"
      : "Please select the type of document you'd like me to analyze:";

    const buttons = [
      {
        type: 'reply',
        reply: {
          id: 'cv_improve',
          title: '📝 Improve CV'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'cover_letter',
          title: '📄 Cover Letter'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'ats_score',
          title: '🎯 ATS Score'
        }
      }
    ];

    const footerText = "Or send any document to get started!";

    return await this.sendInteractiveButtons(to, headerText, bodyText, footerText, buttons);
  }

  // Send follow-up action buttons after document processing
  async sendFollowUpActions(to, documentType) {
    const headerText = "✅ Analysis Complete!";
    const bodyText = "What would you like to do next?";

    const buttons = [
      {
        type: 'reply',
        reply: {
          id: 'another_doc',
          title: '📄 Another Document'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'view_stats',
          title: '📊 My Stats'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'help',
          title: '❓ Help'
        }
      }
    ];

    const footerText = "Type 'STOP' to opt out anytime";

    return await this.sendInteractiveButtons(to, headerText, bodyText, footerText, buttons);
  }

  // Generate and send PDF report
  async generateAndSendPDFReport(to, aiResult, originalFilename, analysisType = 'general') {
    try {
      logger.info('Generating and sending PDF report', {
        to,
        originalFilename,
        analysisType,
        hasAIResult: !!aiResult
      });

      // Generate PDF from AI result with analysis type
      const pdfPath = await this.pdfGenerator.generateProcessedContentPDF(
        aiResult, 
        originalFilename, 
        to,
        analysisType
      );

      // Prepare analysis type-specific caption
      const analysisDisplayName = this.getDocumentTypeDisplayName(analysisType);
      const caption = 
        `📄 *${analysisDisplayName} Analysis Report*\n\n` +
        `📁 Original file: ${originalFilename}\n` +
        `🎯 Analysis type: ${analysisDisplayName}\n` +
        `📅 Generated: ${new Date().toLocaleString()}\n\n` +
        `📋 This professional report contains your AI analysis including summary, key insights, recommendations, and action items.`;

      // Send the PDF document
      const result = await this.sendDocumentFromFile(to, pdfPath, caption);

      // Store PDF temporarily for potential re-access
      await this.fileStorage.storeTemporarily(pdfPath, {
        type: 'generated_pdf_report',
        originalFilename,
        userPhone: to,
        analysisType,
        aiProcessed: true,
        generatedAt: new Date().toISOString()
      });

      // Clean up the original generated file (keeping the stored copy)
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }

      logger.info('PDF report sent successfully', {
        to,
        originalFilename,
        analysisType,
        messageId: result.messages[0].id
      });

      return result;

    } catch (error) {
      logger.error('Failed to generate and send PDF report', {
        to,
        originalFilename,
        error: error.message
      });
      throw error;
    }
  }

  // Improve content with AI
  async improveContentWithAI(extractedContent) {
    try {
      logger.info('Improving content with AI', { 
        contentLength: extractedContent.length 
      });

      if (!extractedContent || extractedContent.trim().length === 0) {
        return {
          error: 'No content to process',
          original: extractedContent
        };
      }

      // TODO: Replace this with actual AI service integration
      // Examples: OpenAI GPT-4, Anthropic Claude, Google Gemini, Cohere, etc.
      
      // Enhanced placeholder AI processing with realistic text analysis
      const lines = extractedContent.split('\n').filter(line => line.trim().length > 0);
      const words = extractedContent.split(/\s+/).filter(word => word.length > 0);
      
      // Extract potential key points (sentences with certain keywords)
      const keyPointKeywords = ['important', 'key', 'main', 'primary', 'essential', 'critical', 'note', 'remember'];
      const potentialKeyPoints = lines.filter(line => 
        keyPointKeywords.some(keyword => line.toLowerCase().includes(keyword)) ||
        line.includes(':') || 
        line.match(/^\d+\./) ||
        line.match(/^[•\-\*]/)
      ).slice(0, 5);

      // Extract potential action items (sentences with action words)
      const actionKeywords = ['should', 'must', 'need', 'required', 'action', 'task', 'do', 'complete', 'follow'];
      const potentialActions = lines.filter(line => 
        actionKeywords.some(keyword => line.toLowerCase().includes(keyword)) ||
        line.toLowerCase().includes('please') ||
        line.match(/^(todo|action|task)/i)
      ).slice(0, 3);

      // Create summary (first few sentences or key lines)
      const summaryLines = lines.slice(0, 3).join(' ').substring(0, 200);
      const summary = summaryLines.length < extractedContent.length ? 
        `${summaryLines}...` : summaryLines;

      // Create tailored content for WhatsApp (shorter, more digestible)
      const tailored = extractedContent.length > 300 ? 
        `${extractedContent.substring(0, 280)}...\n\n💡 Full document processed - see summary above.` :
        extractedContent;

      const improvedContent = {
        original: extractedContent,
        summary: summary || 'Document processed successfully',
        keyPoints: potentialKeyPoints.length > 0 ? 
          potentialKeyPoints.map(point => point.trim().substring(0, 100)) :
          [`Document contains ${words.length} words across ${lines.length} lines`],
        actionItems: potentialActions.length > 0 ? 
          potentialActions.map(action => action.trim().substring(0, 100)) :
          ['Review the extracted content for any required actions'],
        improved: extractedContent,
        tailored: tailored,
        metadata: {
          wordCount: words.length,
          lineCount: lines.length,
          hasStructure: lines.some(line => line.match(/^\d+\./) || line.match(/^[•\-\*]/)),
          estimatedReadTime: Math.ceil(words.length / 200) // words per minute
        }
      };

      // Note: In production, replace the above with actual AI API calls like:
      /*
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "user",
          content: `Please analyze this document and provide:\n1. A brief summary\n2. Key points\n3. Action items\n\nDocument: ${extractedContent}`
        }],
        max_tokens: 500
      });
      */

      return improvedContent;
    } catch (error) {
      logger.error('Error improving content with AI', error);
      return {
        original: extractedContent,
        error: 'AI processing failed',
        summary: 'Processing error occurred',
        improved: extractedContent
      };
    }
  }

  // Document-type-specific analysis methods
  async performDocumentSpecificAnalysis(extractedText, analysisType, userId) {
    try {
      const wordCount = extractedText.split(/\s+/).length;
      const estimatedReadTime = Math.ceil(wordCount / 200);
      
      let analysis = {};
      
      switch (analysisType) {
        case 'cv':
          analysis = await this.analyzeCVDocument(extractedText);
          break;
        case 'cover-letter':
          analysis = await this.analyzeCoverLetterDocument(extractedText);
          break;
        case 'ats-score':
          analysis = await this.analyzeATSCompatibility(extractedText);
          break;
        default:
          analysis = await this.analyzeGeneralDocument(extractedText);
      }
      
      return {
        ...analysis,
        metadata: {
          wordCount,
          estimatedReadTime,
          analysisType,
          processedAt: new Date().toISOString(),
          userId
        }
      };
      
    } catch (error) {
      logger.error('Error in document-specific analysis', error);
      return { error: error.message };
    }
  }

  // CV/Resume specific analysis
  async analyzeCVDocument(extractedText) {
    const text = extractedText.toLowerCase();
    
    // Analyze CV-specific elements
    const hasContactInfo = /email|phone|address|linkedin/.test(text);
    const hasExperience = /experience|work|job|position|role/.test(text);
    const hasEducation = /education|degree|university|college|school/.test(text);
    const hasSkills = /skills|proficient|experienced|knowledge/.test(text);
    
    const keyPoints = [
      hasContactInfo ? "✅ Contact information present" : "❌ Missing contact information",
      hasExperience ? "✅ Work experience section found" : "❌ Work experience needs improvement",
      hasEducation ? "✅ Education details included" : "❌ Education section missing",
      hasSkills ? "✅ Skills section identified" : "❌ Skills section needs enhancement"
    ];

    const actionItems = [
      !hasContactInfo ? "Add complete contact information (email, phone, LinkedIn)" : "Verify contact details are current",
      !hasExperience ? "Expand work experience with achievements and metrics" : "Quantify achievements with specific numbers/percentages",
      !hasSkills ? "Create dedicated skills section with relevant keywords" : "Align skills with target job requirements",
      "Optimize for ATS compatibility with standard formatting"
    ].filter(Boolean);

    return {
      title: "CV/Resume Analysis Report",
      summary: `CV analysis complete. Document contains ${extractedText.split(/\s+/).length} words with ${hasContactInfo + hasExperience + hasEducation + hasSkills} out of 4 key sections present.`,
      keyPoints,
      actionItems,
      score: Math.round(((hasContactInfo + hasExperience + hasEducation + hasSkills) / 4) * 100),
      category: "CV Analysis"
    };
  }

  // Cover Letter specific analysis
  async analyzeCoverLetterDocument(extractedText) {
    const text = extractedText.toLowerCase();
    
    const hasGreeting = /dear|hello|hiring|manager/.test(text);
    const hasCompanyName = text.length < extractedText.length; // Simplified check
    const hasPersonalization = /your|company|organization|team/.test(text);
    const hasClosing = /sincerely|regards|thank|looking forward/.test(text);
    
    const keyPoints = [
      hasGreeting ? "✅ Professional greeting identified" : "❌ Generic or missing greeting",
      hasPersonalization ? "✅ Company-specific content found" : "❌ Lacks personalization",
      hasClosing ? "✅ Professional closing present" : "❌ Weak or missing closing",
      `📊 Length: ${extractedText.split(/\s+/).length} words (ideal: 250-400)`
    ];

    const actionItems = [
      !hasGreeting ? "Add specific hiring manager name or department" : "Strengthen opening hook",
      !hasPersonalization ? "Research and mention specific company achievements" : "Add more company-specific details",
      "Include 2-3 specific achievements with quantifiable results",
      "Align content with job posting keywords"
    ];

    return {
      title: "Cover Letter Enhancement Report",
      summary: `Cover letter analysis reveals ${Math.round(((hasGreeting + hasPersonalization + hasClosing) / 3) * 100)}% optimization score. Focus on personalization and specific achievements.`,
      keyPoints,
      actionItems,
      score: Math.round(((hasGreeting + hasPersonalization + hasClosing) / 3) * 100),
      category: "Cover Letter Analysis"
    };
  }

  // ATS Compatibility analysis
  async analyzeATSCompatibility(extractedText) {
    const text = extractedText.toLowerCase();
    
    // ATS-friendly format checks
    const hasStandardSections = /experience|education|skills/.test(text);
    const hasKeywords = extractedText.split(/\s+/).length > 100;
    const hasMetrics = /\d+%|\d+\+|increased|decreased|improved/.test(text);
    const hasStandardFormatting = !/<|>|\||\{|\}/.test(extractedText);
    
    const atsScore = Math.round(((hasStandardSections + hasKeywords + hasMetrics + hasStandardFormatting) / 4) * 100);
    
    const keyPoints = [
      `🎯 ATS Compatibility Score: ${atsScore}%`,
      hasStandardSections ? "✅ Standard section headers detected" : "❌ Missing standard section headers",
      hasKeywords ? "✅ Sufficient keyword density" : "❌ Low keyword density",
      hasMetrics ? "✅ Quantifiable achievements found" : "❌ Add measurable achievements"
    ];

    const actionItems = [
      !hasStandardSections ? "Use standard headers: Experience, Education, Skills" : "Optimize section organization",
      !hasKeywords ? "Increase relevant industry keywords by 25%" : "Fine-tune keyword placement",
      !hasMetrics ? "Add 3-5 quantified achievements with percentages/numbers" : "Strengthen existing metrics",
      "Use simple, clean formatting without special characters"
    ];

    return {
      title: "ATS Compatibility Analysis",
      summary: `ATS analysis complete with ${atsScore}% compatibility score. ${atsScore >= 70 ? 'Good' : 'Needs improvement'} ATS readability with specific recommendations for optimization.`,
      keyPoints,
      actionItems,
      score: atsScore,
      category: "ATS Analysis"
    };
  }

  // General document analysis (fallback)
  async analyzeGeneralDocument(extractedText) {
    const words = extractedText.split(/\s+/).filter(word => word.length > 0);
    const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
    
    const keyPoints = [
      `📊 Document contains ${words.length} words across ${lines.length} lines`,
      `📖 Estimated reading time: ${Math.ceil(words.length / 200)} minutes`,
      lines.length > 10 ? "✅ Well-structured content" : "❓ Consider adding more structure",
      words.length > 100 ? "✅ Substantial content" : "❓ Consider expanding content"
    ];

    const actionItems = [
      "Review content for clarity and coherence",
      "Check for any spelling or grammar issues",
      "Consider adding headings or bullet points for better readability",
      "Ensure content meets intended purpose and audience"
    ];

    return {
      title: "General Document Analysis",
      summary: `Document analysis complete. Professional document with ${words.length} words providing comprehensive content coverage.`,
      keyPoints,
      actionItems,
      score: Math.min(100, Math.round((words.length / 10) + (lines.length * 2))),
      category: "General Analysis"
    };
  }

  // Helper methods for document type display
  getDocumentTypeDisplayName(type) {
    const displayNames = {
      'cv': 'CV/Resume',
      'cover-letter': 'Cover Letter',
      'ats-score': 'ATS Compatibility',
      'general': 'General Document'
    };
    return displayNames[type] || 'Document';
  }

  getDocumentTypePrompts(type) {
    const prompts = {
      'cv': 'Analyze this CV/Resume for structure, content, and improvement opportunities.',
      'cover-letter': 'Evaluate this cover letter for personalization, impact, and professional presentation.',
      'ats-score': 'Assess this document for ATS (Applicant Tracking System) compatibility and keyword optimization.',
      'general': 'Provide a comprehensive analysis of this document with key insights and recommendations.'
    };
    return prompts[type] || prompts['general'];
  }
}

module.exports = WhatsAppService;