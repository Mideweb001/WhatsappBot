# 🤖 WhatsApp AI File Processing Bot

## Overview

This WhatsApp Business API bot can receive files (documents and images), extract text content, and process them using AI to provide summaries, key points, and action items. Perfect for processing meeting notes, contracts, invoices, and other business documents.

## 🚀 Features

### ✅ File Processing Capabilities
- **PDF Text Extraction**: Extract text from PDF documents
- **Image OCR**: Extract text from images using optical character recognition
- **Plain Text**: Process .txt and .md files
- **Smart Analysis**: AI-powered content analysis and improvement

### 🧠 AI Processing Pipeline
- **Content Extraction**: Intelligently extract text from various file formats
- **Summarization**: Generate concise summaries of document content
- **Key Points**: Identify and extract important information
- **Action Items**: Detect and list actionable tasks and requirements
- **Tailored Content**: Format content optimally for WhatsApp delivery

### 📱 WhatsApp Integration
- **Webhook Processing**: Secure webhook handling with signature verification
- **Message Types**: Support for text, documents, images, and more
- **Real-time Response**: Instant AI-powered responses to file uploads
- **Status Tracking**: Message delivery and read status monitoring

## 🔧 Setup and Configuration

### 1. Environment Variables
Ensure your `.env` file contains:

```bash
# WhatsApp Business API Configuration
WHATSAPP_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_APP_SECRET=your_app_secret
WHATSAPP_API_URL=https://graph.facebook.com/v18.0

# Webhook Configuration
WEBHOOK_VERIFY_TOKEN=my_secure_webhook_token_2024
WEBHOOK_URL=your_public_webhook_url

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 2. Meta Developer Console Setup

1. **Create WhatsApp Business App**: Go to [Meta for Developers](https://developers.facebook.com/apps)
2. **Configure Webhook**: Set webhook URL to `https://your-domain.com/webhook`
3. **Verify Token**: Use the same token as `WEBHOOK_VERIFY_TOKEN` in your .env
4. **Subscribe to Events**: Enable messages, message_deliveries webhooks

### 3. Installation and Startup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test file processing capabilities
node scripts/test-file-processing.js
```

## 📋 Usage Guide

### Sending Files to the Bot

1. **Documents (PDF, TXT, MD)**:
   - Upload any supported document
   - Bot will extract text content
   - Receive AI-processed summary with key points and action items

2. **Images with Text**:
   - Send images containing text (screenshots, scanned documents)
   - Bot uses OCR to extract text
   - Same AI processing as documents

3. **Text Messages**:
   - Send "help" for usage instructions
   - Send "status" for bot health check
   - Regular text messages receive acknowledgment

### Example Bot Response

When you send a PDF document, you'll receive:

```
✅ File Processed Successfully

📁 File: meeting-notes.pdf

📋 Summary:
Important business meeting discussing Q2 timeline and budget allocation...

🔑 Key Points:
1. Project timeline needs acceleration
2. Budget approval required for new licenses
3. Team capacity planning for Q2

✅ Action Items:
1. John should finalize project proposal by Friday
2. Sarah needs to submit budget request to finance
3. Mike must complete hiring process for 2 developers

🎯 Tailored Content:
[Optimized summary for WhatsApp delivery...]
```

## 🛠️ Technical Architecture

### Core Components

#### 1. WhatsApp Service (`src/services/whatsappService.js`)
- **Media Download**: Downloads files using WhatsApp media IDs
- **Text Extraction**: PDF parsing and image OCR capabilities
- **AI Processing**: Content analysis and improvement
- **Message Handling**: Send/receive WhatsApp messages

#### 2. Webhook Router (`src/routes/webhook.js`)
- **Signature Verification**: Secure webhook validation
- **Message Processing**: Route different message types
- **Error Handling**: Comprehensive error management

#### 3. File Processing Pipeline
```
Incoming File → Download → Extract Text → AI Analysis → Format Response → Send to User
```

### AI Processing Methods

#### `processFileWithAI(filePath, messageType)`
- Main orchestrator for file processing
- Handles different file types (document/image)
- Calls appropriate extraction method

#### `extractTextFromDocument(filePath)`
- PDF text extraction using pdf-parse
- Plain text file reading
- Error handling for unsupported formats

#### `extractTextFromImage(filePath)`
- OCR using tesseract.js
- Multi-language support (configurable)
- Confidence scoring for text detection

#### `improveContentWithAI(extractedContent)`
- Smart content analysis
- Key point extraction using keyword detection
- Action item identification
- Summary generation
- WhatsApp-optimized formatting

## 🔒 Security Features

### Webhook Verification
- **Signature Validation**: Verify requests from Meta using HMAC-SHA256
- **Token Verification**: Validate webhook subscription with verify token
- **Error Handling**: Proper error responses for invalid requests

### Environment Security
- **Secret Management**: Sensitive data in environment variables
- **Access Token Protection**: Secure API token handling
- **File System Security**: Temporary file storage with cleanup

## 🧪 Testing

### Local Testing
```bash
# Test file processing
node scripts/test-file-processing.js

# Test webhook verification
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=my_secure_webhook_token_2024&hub.challenge=test123"
```

### File Processing Test
The test script creates a sample document and processes it through the entire AI pipeline, demonstrating:
- Text extraction capabilities
- AI content analysis
- Key point identification
- Action item detection
- Metadata generation

## 📁 Project Structure

```
whatsappBot/
├── src/
│   ├── server.js              # Main Express server
│   ├── middleware/
│   │   └── errorHandler.js    # Global error handling
│   ├── routes/
│   │   ├── webhook.js         # WhatsApp webhook handling
│   │   ├── messages.js        # Message management
│   │   └── business.js        # Business profile management
│   ├── services/
│   │   └── whatsappService.js # Core WhatsApp/AI service
│   └── utils/
│       └── logger.js          # Logging utilities
├── scripts/
│   ├── test-file-processing.js # File processing tests
│   ├── setup-business.js      # Business profile setup
│   └── verify-webhook.js      # Webhook verification tests
├── downloads/                 # Temporary file storage
├── logs/                      # Application logs
│   ├── combined.log
│   └── error.log
└── .env                       # Environment configuration
```

## 🚀 Deployment Options

### 1. Railway (Recommended)
```bash
# Deploy to Railway
railway login
railway link
railway up
```

### 2. Local with Tunnel
```bash
# Using ngrok
npm install -g ngrok
ngrok http 3000

# Using cloudflared
npm install -g cloudflared
cloudflared tunnel --url http://localhost:3000
```

### 3. Manual Cloud Deployment
- **Heroku**: Use provided Procfile
- **AWS/Azure/GCP**: Configure environment variables
- **Docker**: Build container with Node.js runtime

## 🔧 Customization Options

### AI Service Integration
Replace the placeholder AI processing in `improveContentWithAI()` with:

#### OpenAI GPT
```javascript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: `Analyze: ${extractedContent}` }]
});
```

#### Anthropic Claude
```javascript
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const response = await anthropic.messages.create({
  model: "claude-3-sonnet-20240229",
  messages: [{ role: "user", content: `Analyze: ${extractedContent}` }]
});
```

### File Format Support
Add support for more file types:
- **DOC/DOCX**: Use mammoth.js
- **Excel**: Use xlsx package
- **PowerPoint**: Use officegen or similar
- **Audio**: Use speech-to-text APIs

### Response Customization
Modify response templates in `handleMediaMessage()` to match your brand voice and requirements.

## 📊 Monitoring and Logs

### Log Levels
- **Info**: Normal operations, message processing
- **Warn**: Non-critical issues, unsupported formats
- **Error**: Processing failures, API errors

### File Locations
- **Combined Logs**: `logs/combined.log`
- **Error Logs**: `logs/error.log`
- **Console**: Development mode only

### Monitoring Endpoints
- **Health Check**: `GET /health`
- **Webhook Status**: `GET /webhook` (returns 400 without params)

## 🆘 Troubleshooting

### Common Issues

#### 1. Webhook Verification Fails
- Check `WEBHOOK_VERIFY_TOKEN` matches Meta console
- Ensure public URL is accessible
- Verify SSL/HTTPS configuration

#### 2. File Download Errors
- Confirm `WHATSAPP_TOKEN` has media permissions
- Check network connectivity
- Verify media ID validity

#### 3. AI Processing Fails
- Check file extraction logs
- Verify file format support
- Review extracted content quality

#### 4. Message Sending Issues
- Validate `WHATSAPP_PHONE_NUMBER_ID`
- Check business verification status
- Confirm API rate limits

### Debug Commands
```bash
# Check environment variables
node -e "console.log(process.env.WHATSAPP_TOKEN ? 'Token OK' : 'Token Missing')"

# Test webhook locally
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=my_secure_webhook_token_2024&hub.challenge=test"

# Monitor logs
tail -f logs/combined.log
```

## 📝 Next Steps

1. **Deploy to Production**: Use Railway, Heroku, or cloud provider
2. **Integrate Real AI**: Replace placeholder with OpenAI, Claude, etc.
3. **Add File Types**: Expand support for more document formats
4. **Implement Database**: Store processed files and user interactions
5. **Add Analytics**: Track usage patterns and performance metrics
6. **Scale Processing**: Implement queue system for large files

---

**🎉 Your WhatsApp AI File Processing Bot is ready!**

Send documents, images, or text messages to your WhatsApp Business number and watch the AI-powered processing in action.