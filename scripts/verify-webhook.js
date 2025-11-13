#!/usr/bin/env node

/**
 * WhatsApp Business Verification Script
 * 
 * This script helps you verify your webhook endpoint with WhatsApp Business API.
 * Run this after setting up your webhook URL in the Meta Developer Console.
 */

const axios = require('axios');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const LOCAL_WEBHOOK_URL = `http://localhost:${PORT}/webhook`;

async function verifyWebhook() {
  console.log('🔍 Starting webhook verification...\n');
  
  if (!VERIFY_TOKEN) {
    console.error('❌ WEBHOOK_VERIFY_TOKEN is not set in environment variables');
    process.exit(1);
  }
  
  console.log(`📡 Local Webhook URL: ${LOCAL_WEBHOOK_URL}`);
  console.log(`🔐 Verify Token: ${VERIFY_TOKEN.substring(0, 5)}...`);
  
  try {
    // Test if server is running
    console.log('\n1️⃣ Checking if server is running...');
    const healthCheck = await axios.get(`http://localhost:${PORT}/health`);
    console.log('✅ Server is running and healthy');
    
    // Test webhook verification endpoint
    const verificationUrl = `${LOCAL_WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test_challenge`;
    
    console.log('\n2️⃣ Testing webhook verification endpoint...');
    const response = await axios.get(verificationUrl);
    
    if (response.status === 200 && response.data === 'test_challenge') {
      console.log('✅ Webhook verification successful!');
      console.log('✅ Your webhook is ready to receive WhatsApp events');
    } else {
      console.log('❌ Webhook verification failed');
      console.log(`   Response status: ${response.status}`);
      console.log(`   Response data: ${response.data}`);
    }
    
  } catch (error) {
    console.error('❌ Webhook verification failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your webhook server is running:');
      console.log('   npm run dev');
    }
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. If verification succeeded, configure webhook in Meta Developer Console');
  console.log('2. Add your webhook URL to your WhatsApp Business App');
  console.log('3. Subscribe to webhook events: messages, message_deliveries');
  console.log('4. Test by sending a message to your WhatsApp Business number');
}

// Run verification
verifyWebhook().catch(console.error);