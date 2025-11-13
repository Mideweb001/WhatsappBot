const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ConversationTracker {
  constructor() {
    this.conversationsDir = path.join(process.cwd(), 'conversations');
    this.conversationsFile = path.join(this.conversationsDir, 'users.json');
    this.conversations = new Map();
    
    // Create conversations directory if it doesn't exist
    if (!fs.existsSync(this.conversationsDir)) {
      fs.mkdirSync(this.conversationsDir, { recursive: true });
    }
    
    // Load existing conversations
    this.loadConversations();
    
    // Auto-save conversations periodically
    setInterval(() => {
      this.saveConversations();
    }, 30000); // Save every 30 seconds
  }

  /**
   * Load conversations from disk
   */
  loadConversations() {
    try {
      if (fs.existsSync(this.conversationsFile)) {
        const data = fs.readFileSync(this.conversationsFile, 'utf8');
        const conversationsObj = JSON.parse(data);
        
        // Convert object back to Map
        for (const [phone, userData] of Object.entries(conversationsObj)) {
          this.conversations.set(phone, userData);
        }
        
        logger.info('Conversations loaded from disk', {
          totalUsers: this.conversations.size
        });
      }
    } catch (error) {
      logger.error('Error loading conversations', error);
      this.conversations = new Map();
    }
  }

  /**
   * Save conversations to disk
   */
  saveConversations() {
    try {
      // Convert Map to object for JSON serialization
      const conversationsObj = Object.fromEntries(this.conversations);
      
      fs.writeFileSync(
        this.conversationsFile, 
        JSON.stringify(conversationsObj, null, 2)
      );
      
      logger.debug('Conversations saved to disk', {
        totalUsers: this.conversations.size
      });
    } catch (error) {
      logger.error('Error saving conversations', error);
    }
  }

  /**
   * Initialize or get user conversation data
   * @param {string} phoneNumber - User's phone number
   * @returns {Object} - User conversation data
   */
  getOrCreateUser(phoneNumber) {
    if (!this.conversations.has(phoneNumber)) {
      const userData = {
        phoneNumber,
        firstMessage: new Date().toISOString(),
        lastMessage: new Date().toISOString(),
        messageCount: 0,
        documentCount: 0,
        pdfCount: 0,
        isOptedOut: false,
        preferences: {
          documentType: null, // 'cv', 'cover-letter', 'general'
          language: 'en',
          notifications: true
        },
        conversationHistory: [],
        lastInteractionType: null,
        sessionState: {
          awaitingDocument: false,
          documentType: null,
          lastQuickReply: null
        }
      };
      
      this.conversations.set(phoneNumber, userData);
      
      logger.info('New user conversation initialized', {
        phoneNumber,
        timestamp: userData.firstMessage
      });
    }
    
    return this.conversations.get(phoneNumber);
  }

  /**
   * Update user's last message time and increment counters
   * @param {string} phoneNumber - User's phone number
   * @param {string} messageType - Type of message ('text', 'document', 'interactive')
   */
  updateUserActivity(phoneNumber, messageType = 'text') {
    const userData = this.getOrCreateUser(phoneNumber);
    
    userData.lastMessage = new Date().toISOString();
    userData.messageCount += 1;
    userData.lastInteractionType = messageType;
    
    if (messageType === 'document') {
      userData.documentCount += 1;
    }
    
    logger.debug('User activity updated', {
      phoneNumber,
      messageType,
      totalMessages: userData.messageCount,
      totalDocuments: userData.documentCount
    });
  }

  /**
   * Add message to conversation history
   * @param {string} phoneNumber - User's phone number
   * @param {Object} message - Message object
   */
  addToHistory(phoneNumber, message) {
    const userData = this.getOrCreateUser(phoneNumber);
    
    const historyEntry = {
      timestamp: new Date().toISOString(),
      type: message.type || 'unknown',
      content: message.content || '',
      direction: message.direction || 'incoming', // 'incoming' or 'outgoing'
      processed: message.processed || false
    };
    
    userData.conversationHistory.push(historyEntry);
    
    // Keep only last 50 messages to prevent memory issues
    if (userData.conversationHistory.length > 50) {
      userData.conversationHistory = userData.conversationHistory.slice(-50);
    }
  }

  /**
   * Set user's document type preference
   * @param {string} phoneNumber - User's phone number
   * @param {string} documentType - Document type preference
   */
  setDocumentTypePreference(phoneNumber, documentType) {
    const userData = this.getOrCreateUser(phoneNumber);
    userData.preferences.documentType = documentType;
    userData.sessionState.documentType = documentType;
    
    logger.info('User document preference set', {
      phoneNumber,
      documentType
    });
  }

  /**
   * Set session state for awaiting document
   * @param {string} phoneNumber - User's phone number
   * @param {boolean} awaiting - Whether awaiting document
   * @param {string} documentType - Type of document expected
   */
  setAwaitingDocument(phoneNumber, awaiting, documentType = null) {
    const userData = this.getOrCreateUser(phoneNumber);
    userData.sessionState.awaitingDocument = awaiting;
    userData.sessionState.documentType = documentType;
    
    logger.info('User session state updated', {
      phoneNumber,
      awaitingDocument: awaiting,
      documentType
    });
  }

  /**
   * Record quick reply selection
   * @param {string} phoneNumber - User's phone number
   * @param {string} quickReply - Quick reply selected
   */
  recordQuickReply(phoneNumber, quickReply) {
    const userData = this.getOrCreateUser(phoneNumber);
    userData.sessionState.lastQuickReply = quickReply;
    
    this.addToHistory(phoneNumber, {
      type: 'quick_reply',
      content: quickReply,
      direction: 'incoming'
    });
  }

  /**
   * Opt user out of the service
   * @param {string} phoneNumber - User's phone number
   */
  optOutUser(phoneNumber) {
    const userData = this.getOrCreateUser(phoneNumber);
    userData.isOptedOut = true;
    userData.optOutDate = new Date().toISOString();
    
    logger.info('User opted out', {
      phoneNumber,
      optOutDate: userData.optOutDate
    });
  }

  /**
   * Opt user back into the service
   * @param {string} phoneNumber - User's phone number
   */
  optInUser(phoneNumber) {
    const userData = this.getOrCreateUser(phoneNumber);
    userData.isOptedOut = false;
    userData.optInDate = new Date().toISOString();
    
    logger.info('User opted back in', {
      phoneNumber,
      optInDate: userData.optInDate
    });
  }

  /**
   * Check if user is opted out
   * @param {string} phoneNumber - User's phone number
   * @returns {boolean} - Whether user is opted out
   */
  isUserOptedOut(phoneNumber) {
    const userData = this.conversations.get(phoneNumber);
    return userData ? userData.isOptedOut : false;
  }

  /**
   * Increment PDF generation count
   * @param {string} phoneNumber - User's phone number
   */
  incrementPDFCount(phoneNumber) {
    const userData = this.getOrCreateUser(phoneNumber);
    userData.pdfCount += 1;
    
    logger.debug('User PDF count incremented', {
      phoneNumber,
      totalPDFs: userData.pdfCount
    });
  }

  /**
   * Get user statistics
   * @param {string} phoneNumber - User's phone number
   * @returns {Object} - User statistics
   */
  getUserStats(phoneNumber) {
    const userData = this.conversations.get(phoneNumber);
    
    if (!userData) {
      return null;
    }
    
    return {
      phoneNumber: userData.phoneNumber,
      firstMessage: userData.firstMessage,
      lastMessage: userData.lastMessage,
      messageCount: userData.messageCount,
      documentCount: userData.documentCount,
      pdfCount: userData.pdfCount,
      isOptedOut: userData.isOptedOut,
      preferredDocumentType: userData.preferences.documentType,
      daysSinceFirstMessage: Math.floor(
        (new Date() - new Date(userData.firstMessage)) / (1000 * 60 * 60 * 24)
      )
    };
  }

  /**
   * Get overall service statistics
   * @returns {Object} - Service statistics
   */
  getServiceStats() {
    const totalUsers = this.conversations.size;
    let optedOutUsers = 0;
    let totalMessages = 0;
    let totalDocuments = 0;
    let totalPDFs = 0;
    let activeUsers = 0;
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    for (const userData of this.conversations.values()) {
      if (userData.isOptedOut) optedOutUsers++;
      
      totalMessages += userData.messageCount;
      totalDocuments += userData.documentCount;
      totalPDFs += userData.pdfCount;
      
      if (new Date(userData.lastMessage) > oneDayAgo) {
        activeUsers++;
      }
    }
    
    return {
      totalUsers,
      activeUsers,
      optedOutUsers,
      activeUserRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(1) + '%' : '0%',
      optOutRate: totalUsers > 0 ? (optedOutUsers / totalUsers * 100).toFixed(1) + '%' : '0%',
      totalMessages,
      totalDocuments,
      totalPDFs,
      avgMessagesPerUser: totalUsers > 0 ? (totalMessages / totalUsers).toFixed(1) : 0,
      avgDocumentsPerUser: totalUsers > 0 ? (totalDocuments / totalUsers).toFixed(1) : 0
    };
  }

  /**
   * Clean up old conversation data
   * @param {number} daysOld - Days old to consider for cleanup
   */
  cleanupOldConversations(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let cleanedCount = 0;
    
    for (const [phoneNumber, userData] of this.conversations.entries()) {
      const lastMessageDate = new Date(userData.lastMessage);
      
      if (lastMessageDate < cutoffDate && userData.isOptedOut) {
        this.conversations.delete(phoneNumber);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.saveConversations();
      logger.info('Old conversations cleaned up', {
        cleanedCount,
        daysOld,
        remainingUsers: this.conversations.size
      });
    }
    
    return cleanedCount;
  }
}

module.exports = ConversationTracker;