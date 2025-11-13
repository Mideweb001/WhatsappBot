# WhatsApp Business API Integration

A comprehensive Node.js server for integrating with WhatsApp Business API using Meta's Cloud API. This project provides webhook handling, message processing, business verification, and a complete API for sending various types of WhatsApp messages.

## 🚀 Features

- **Webhook Integration**: Secure webhook handling for incoming WhatsApp messages
- **Message Processing**: Support for text, media, interactive, and template messages
- **Business Setup**: Business profile management and verification utilities
- **Security**: Webhook signature verification and comprehensive error handling
- **Logging**: Structured logging with Winston for debugging and monitoring
- **API Endpoints**: RESTful APIs for sending messages and managing business profile

## 📋 Prerequisites

Before setting up your WhatsApp Business API, you'll need:

1. **Meta Developer Account**: [developers.facebook.com](https://developers.facebook.com)
2. **Facebook Business Manager**: [business.facebook.com](https://business.facebook.com)
3. **WhatsApp Business Account**: Verified business account
4. **Node.js**: Version 14 or higher
5. **Public HTTPS URL**: For webhook (use ngrok for development)

## 🔧 Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   # Meta Cloud API Configuration
   WHATSAPP_TOKEN=your_whatsapp_access_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
   WHATSAPP_APP_ID=your_app_id
   WHATSAPP_APP_SECRET=your_app_secret
   
   # Webhook Configuration
   WEBHOOK_VERIFY_TOKEN=your_unique_verify_token
   WEBHOOK_URL=https://your-domain.com/webhook
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

## 🔑 Getting Your WhatsApp Business API Credentials

### Step 1: Create a Meta Developer App

1. Go to [Meta Developer Console](https://developers.facebook.com/apps/)
2. Click "Create App" and select "Business" use case
3. Add WhatsApp Business Platform product
4. Generate a temporary access token (24 hours)

### Step 2: Set Up WhatsApp Business Account

1. In your Meta Developer app, navigate to WhatsApp > API Setup
2. Add a phone number or use the test number provided
3. Note your Phone Number ID and Business Account ID
4. Generate a permanent access token in Business Manager

### Step 3: Configure Webhook

1. Start your local server: `npm run dev`
2. Expose it publicly using ngrok: `ngrok http 3000`
3. In Meta Developer Console, add webhook URL: `https://your-ngrok-url.com/webhook`
4. Use your `WEBHOOK_VERIFY_TOKEN` for verification
5. Subscribe to `messages` and `message_deliveries` events

## 🚀 Quick Start

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Verify your webhook**:
   ```bash
   npm run verify-webhook
   ```

3. **Set up business profile**:
   ```bash
   npm run setup-business
   ```

## 📡 API Endpoints

### Webhook
- `GET /webhook` - Webhook verification
- `POST /webhook` - Receive WhatsApp events

### Messages
- `POST /api/messages/send-text` - Send text message
- `POST /api/messages/send-template` - Send template message
- `POST /api/messages/send-media` - Send media message
- `POST /api/messages/send-interactive` - Send interactive message
- `POST /api/messages/mark-read` - Mark message as read
- `GET /api/messages/media/:mediaId` - Get media URL
- `POST /api/messages/upload-media` - Upload media

### Business
- `GET /api/business/profile` - Get business profile
- `PUT /api/business/profile` - Update business profile
- `GET /api/business/phone-info` - Get phone number info
- `POST /api/business/verify` - Submit business verification
- `GET /api/business/verification-status` - Check verification status
- `POST /api/business/setup-webhook` - Configure webhook
- `GET /api/business/templates` - Get message templates
- `POST /api/business/templates` - Create message template

## 📱 Usage Examples

### Send a Text Message

```bash
curl -X POST http://localhost:3000/api/messages/send-text \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "1234567890",
    "message": "Hello from WhatsApp Business API!",
    "previewUrl": false
  }'
```

### Send a Template Message

```bash
curl -X POST http://localhost:3000/api/messages/send-template \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "1234567890",
    "templateName": "hello_world",
    "language": "en_US"
  }'
```

### Send Interactive Button Message

```bash
curl -X POST http://localhost:3000/api/messages/send-interactive \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "1234567890",
    "type": "button",
    "header": {"type": "text", "text": "Choose an option"},
    "body": {"text": "How can we help you today?"},
    "footer": {"text": "Powered by WhatsApp Business API"},
    "action": {
      "buttons": [
        {"type": "reply", "reply": {"id": "support", "title": "Support"}},
        {"type": "reply", "reply": {"id": "sales", "title": "Sales"}}
      ]
    }
  }'
```

## 🔐 Business Verification Process

### Requirements for WhatsApp Business API

1. **Business Verification**: 
   - Valid business registration documents
   - Business website or social media presence
   - Business phone number
   - Business email address

2. **Facebook Business Manager Setup**:
   - Verified Business Manager account
   - Business portfolio with correct information
   - Payment method (for messaging costs)

3. **WhatsApp Business Profile**:
   - Complete business information
   - Profile picture and description
   - Business category selection

### Verification Steps

1. **Submit Application**: Use the business verification endpoint
2. **Document Upload**: Provide required business documents
3. **Review Process**: Wait 5-7 business days for Meta review
4. **Approval**: Receive approval and activate messaging
5. **Go Live**: Start sending messages to customers

## 🛡️ Security Features

- **Webhook Signature Verification**: Validates incoming webhook requests
- **Environment Variables**: Secure credential management
- **Rate Limiting**: Built-in protection against abuse
- **Error Handling**: Comprehensive error logging and responses
- **HTTPS Required**: Secure communication with WhatsApp API

## 📊 Monitoring and Logging

The application includes comprehensive logging:

- **Console Logs**: Real-time development feedback
- **File Logs**: Persistent logging for production
- **Error Tracking**: Separate error log file
- **Webhook Events**: Detailed message processing logs

Log files are stored in the `logs/` directory:
- `error.log` - Error-level logs only
- `combined.log` - All log levels

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WHATSAPP_TOKEN` | Access token from Meta Developer Console | Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID from WhatsApp setup | Yes |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Business account ID | Yes |
| `WHATSAPP_APP_SECRET` | App secret for webhook verification | Yes |
| `WEBHOOK_VERIFY_TOKEN` | Custom token for webhook verification | Yes |
| `WEBHOOK_URL` | Public HTTPS URL for your webhook | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | No |

## 🚀 Deployment

### Production Deployment

1. **Set up production environment**:
   ```bash
   export NODE_ENV=production
   ```

2. **Use a process manager**:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name whatsapp-bot
   ```

3. **Set up reverse proxy** (nginx example):
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Using Railway/Heroku

1. Create `Procfile`:
   ```
   web: node src/server.js
   ```

2. Set environment variables in your hosting platform
3. Deploy and update webhook URL in Meta Developer Console

## 🧪 Testing

```bash
# Run tests
npm test

# Verify webhook endpoint
npm run verify-webhook

# Set up business profile
npm run setup-business
```

## 📚 Additional Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [Webhook Testing with ngrok](https://ngrok.com/)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)

## 🔄 Message Flow

1. **Incoming Message**: WhatsApp → Meta → Your Webhook
2. **Processing**: Your server processes the message
3. **Response**: Your server sends response via WhatsApp API
4. **Delivery**: WhatsApp delivers response to user

## ⚠️ Rate Limits and Costs

- **Rate Limits**: 1000 messages per second (varies by tier)
- **Messaging Costs**: Charges apply for business-initiated conversations
- **Free Tier**: 1000 conversations per month for new businesses

## 📞 Support

For issues related to:
- **WhatsApp API**: Contact Meta Developer Support
- **Business Verification**: Facebook Business Support
- **This Code**: Create an issue in the repository

## 📄 License

MIT License - see LICENSE file for details.

---

**🎉 Your WhatsApp Business API integration is now ready!**

Start by configuring your `.env` file, then run `npm run dev` to begin testing your WhatsApp Business integration.