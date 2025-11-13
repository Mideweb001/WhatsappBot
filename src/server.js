const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const webhookRoutes = require('./routes/webhook');
const messageRoutes = require('./routes/messages');
const businessRoutes = require('./routes/business');
const filesRoutes = require('./routes/files');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Business API Bot'
  });
});

// Routes
// API Routes
app.use('/webhook', webhookRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/files', filesRoutes);

// Root endpoint with API information
app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Business API Integration',
    version: '1.0.0',
    endpoints: {
      webhook: '/webhook',
      messages: '/api/messages',
      business: '/api/business',
      health: '/health'
    },
    documentation: 'https://developers.facebook.com/docs/whatsapp/cloud-api'
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 WhatsApp Business API server running on port ${PORT}`);
  logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Webhook URL should be: ${process.env.WEBHOOK_URL || `http://localhost:${PORT}/webhook`}`);
});

module.exports = app;