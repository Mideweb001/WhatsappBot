#!/bin/bash

# WhatsApp Bot Setup Helper Script
# This script helps you start ngrok and update your webhook configuration

echo "🚀 Starting WhatsApp Bot Setup Helper"
echo ""

# Check if WhatsApp server is running
echo "1️⃣ Checking WhatsApp server status..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ WhatsApp server is running on port 3000"
else
    echo "❌ WhatsApp server is not running"
    echo "💡 Start it with: npm run dev"
    exit 1
fi

echo ""
echo "2️⃣ Starting ngrok tunnel..."
echo "💡 Press Ctrl+C when you see the forwarding URL to continue setup"
echo ""

# Start ngrok and capture output
ngrok http 3000 --log=stdout | while read line; do
    echo "$line"
    if [[ $line == *"Forwarding"* ]] && [[ $line == *"https://"* ]]; then
        # Extract the HTTPS URL
        NGROK_URL=$(echo "$line" | grep -o 'https://[^[:space:]]*')
        WEBHOOK_URL="${NGROK_URL}/webhook"
        
        echo ""
        echo "🎉 Ngrok tunnel established!"
        echo "📡 Public URL: $NGROK_URL"
        echo "🔗 Webhook URL: $WEBHOOK_URL"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Copy this webhook URL: $WEBHOOK_URL"
        echo "2. Go to Meta Developer Console:"
        echo "   https://developers.facebook.com/apps/852405627371092/whatsapp-business/wa-settings/"
        echo "3. Add webhook with:"
        echo "   - URL: $WEBHOOK_URL"
        echo "   - Verify Token: my_secure_webhook_token_2024"
        echo "   - Subscribe to: messages, message_deliveries"
        echo ""
        echo "4. Test webhook verification:"
        echo "   curl \"$WEBHOOK_URL?hub.mode=subscribe&hub.verify_token=my_secure_webhook_token_2024&hub.challenge=test\""
        echo ""
        echo "Keep this terminal open to maintain the tunnel!"
        echo "Press Ctrl+C to stop the tunnel"
        
        # Update .env file
        if [ -f .env ]; then
            sed -i.bak "s|WEBHOOK_URL=.*|WEBHOOK_URL=$WEBHOOK_URL|" .env
            echo "✅ Updated .env file with new webhook URL"
        fi
        
        break
    fi
done