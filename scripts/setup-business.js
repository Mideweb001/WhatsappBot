#!/usr/bin/env node

/**
 * Business Setup Script
 * 
 * This script helps you set up your WhatsApp Business profile and configuration.
 */

const WhatsAppService = require('../src/services/whatsappService');
const logger = require('../src/utils/logger');
require('dotenv').config();

async function setupBusiness() {
  console.log('🏢 Starting WhatsApp Business setup...\n');
  
  const whatsAppService = new WhatsAppService();
  
  try {
    // Check if we can connect to WhatsApp API
    console.log('🔌 Testing WhatsApp API connection...');
    const phoneInfo = await whatsAppService.getPhoneNumberInfo();
    console.log('✅ Successfully connected to WhatsApp API');
    console.log(`📱 Phone Number: ${phoneInfo.display_phone_number}`);
    console.log(`🆔 Phone Number ID: ${phoneInfo.id}`);
    
    // Get current business profile
    console.log('\n📋 Getting current business profile...');
    try {
      const profile = await whatsAppService.getBusinessProfile();
      console.log('✅ Business profile found:');
      console.log(`   Name: ${profile.about || 'Not set'}`);
      console.log(`   Description: ${profile.description || 'Not set'}`);
      console.log(`   Website: ${profile.website ? profile.website.join(', ') : 'Not set'}`);
      console.log(`   Email: ${profile.email || 'Not set'}`);
    } catch (error) {
      console.log('⚠️  Business profile not configured yet');
    }
    
    // Setup business profile if environment variables are provided
    const businessUpdates = {};
    
    if (process.env.BUSINESS_NAME) {
      businessUpdates.about = process.env.BUSINESS_NAME;
    }
    
    if (process.env.BUSINESS_DESCRIPTION) {
      businessUpdates.description = process.env.BUSINESS_DESCRIPTION;
    }
    
    if (process.env.BUSINESS_WEBSITE) {
      businessUpdates.websites = [process.env.BUSINESS_WEBSITE];
    }
    
    if (process.env.BUSINESS_EMAIL) {
      businessUpdates.email = process.env.BUSINESS_EMAIL;
    }
    
    if (Object.keys(businessUpdates).length > 0) {
      console.log('\n🔧 Updating business profile...');
      await whatsAppService.updateBusinessProfile(businessUpdates);
      console.log('✅ Business profile updated successfully');
    }
    
    // Get message templates
    console.log('\n📄 Getting message templates...');
    try {
      const templates = await whatsAppService.getMessageTemplates();
      console.log(`✅ Found ${templates.length} message templates`);
      
      if (templates.length > 0) {
        console.log('\n📋 Available templates:');
        templates.forEach((template, index) => {
          console.log(`   ${index + 1}. ${template.name} (${template.status})`);
        });
      }
    } catch (error) {
      console.log('⚠️  Could not fetch message templates');
    }
    
    console.log('\n🎉 Business setup completed successfully!');
    
    console.log('\n📋 Configuration Summary:');
    console.log(`✅ WhatsApp API: Connected`);
    console.log(`✅ Phone Number: ${phoneInfo.display_phone_number}`);
    console.log(`✅ Business Profile: ${Object.keys(businessUpdates).length > 0 ? 'Updated' : 'Existing'}`);
    console.log(`✅ Webhook: ${process.env.WEBHOOK_URL ? 'Configured' : 'Needs setup'}`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Verify your webhook endpoint: npm run verify-webhook');
    console.log('2. Configure webhook in Meta Developer Console');
    console.log('3. Test message sending via API endpoints');
    console.log('4. Create message templates if needed');
    
  } catch (error) {
    console.error('❌ Business setup failed:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Authentication failed. Check your access token:');
      console.log('   - Verify WHATSAPP_TOKEN in .env file');
      console.log('   - Ensure token has required permissions');
      console.log('   - Check if token has expired');
    } else if (error.response?.status === 403) {
      console.log('\n💡 Permission denied. Check:');
      console.log('   - Business verification status');
      console.log('   - WhatsApp Business API access');
      console.log('   - Phone number permissions');
    }
    
    process.exit(1);
  }
}

// Run setup
setupBusiness().catch(console.error);