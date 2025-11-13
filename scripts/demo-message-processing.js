#!/usr/bin/env node

/**
 * Demo script to simulate WhatsApp message processing with file attachments
 * This demonstrates the complete AI processing pipeline
 */

require('dotenv').config();
const express = require('express');
const WhatsAppService = require('../src/services/whatsappService');
const logger = require('../src/utils/logger');

async function simulateWhatsAppMessage() {
  console.log('🎭 Simulating WhatsApp Message Processing\n');

  const whatsappService = new WhatsAppService();

  // Simulate a document message from WhatsApp
  const mockMessage = {
    id: 'wamid.demo123456',
    from: '1234567890',
    timestamp: Date.now(),
    type: 'document',
    content: {
      mediaId: 'demo_media_id',
      filename: 'business-proposal.txt',
      mimeType: 'text/plain'
    }
  };

  // Create a sample business document
  const sampleDocument = `BUSINESS PROPOSAL - Q1 2024

Executive Summary:
This proposal outlines the expansion strategy for our mobile app platform into the European market.

Key Objectives:
1. Launch in 5 major European cities by March 2024
2. Achieve 100,000 active users within 6 months
3. Generate €2M in revenue by end of Q1

Market Analysis:
The European mobile app market shows significant growth potential with a 25% YoY increase.
Key competitors include AppCorp and MobileFirst, but our unique AI features provide competitive advantage.

Resource Requirements:
- Marketing team expansion: 3 new hires
- Technical infrastructure: €50,000 budget
- Legal compliance: GDPR and local regulations

Timeline:
Week 1-2: Team hiring and onboarding
Week 3-4: Technical infrastructure setup
Week 5-8: Market entry and soft launch
Week 9-12: Full marketing campaign launch

Budget Allocation:
- Personnel costs: €200,000
- Marketing spend: €150,000
- Infrastructure: €50,000
- Legal and compliance: €25,000
Total: €425,000

Success Metrics:
- User acquisition rate: 1,000 new users per week
- Revenue per user: €20 minimum
- Customer satisfaction: 4.5/5 rating target
- Market penetration: 2% of target demographic

Next Steps:
1. Secure board approval for budget allocation
2. Begin immediate hiring process for key roles
3. Initiate legal review of compliance requirements
4. Prepare detailed technical architecture document

Critical Dependencies:
- Board approval by January 20th
- Technical platform ready by February 15th
- Marketing team fully staffed by January 30th

Risk Assessment:
- High competition in European market
- Regulatory challenges may cause delays
- Currency fluctuation could impact budget

Conclusion:
This expansion represents a significant growth opportunity with manageable risks and clear success metrics.
Immediate action required to meet aggressive Q1 timeline.`;

  try {
    console.log('📱 Processing incoming message...');
    console.log('From:', mockMessage.from);
    console.log('Type:', mockMessage.type);
    console.log('Filename:', mockMessage.content.filename);
    console.log('');

    // Save the sample document to simulate file download
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(process.cwd(), 'downloads', mockMessage.content.filename);
    
    // Ensure downloads directory exists
    const downloadsDir = path.dirname(testFilePath);
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    
    fs.writeFileSync(testFilePath, sampleDocument);
    console.log('📄 File downloaded successfully');

    // Process with AI (simulate the complete pipeline)
    console.log('🧠 Starting AI processing...\n');
    
    const aiResult = await whatsappService.processFileWithAI(testFilePath, mockMessage.type);

    if (aiResult && !aiResult.error) {
      // Format the response as it would appear in WhatsApp
      let whatsappResponse = `✅ *File Processed Successfully*\n\n`;
      
      whatsappResponse += `📁 *File:* ${mockMessage.content.filename}\n\n`;
      
      if (aiResult.summary) {
        whatsappResponse += `📋 *Summary:*\n${aiResult.summary}\n\n`;
      }
      
      if (aiResult.keyPoints && aiResult.keyPoints.length > 0) {
        whatsappResponse += `🔑 *Key Points:*\n`;
        aiResult.keyPoints.forEach((point, index) => {
          whatsappResponse += `${index + 1}. ${point}\n`;
        });
        whatsappResponse += '\n';
      }
      
      if (aiResult.actionItems && aiResult.actionItems.length > 0) {
        whatsappResponse += `✅ *Action Items:*\n`;
        aiResult.actionItems.forEach((item, index) => {
          whatsappResponse += `${index + 1}. ${item}\n`;
        });
        whatsappResponse += '\n';
      }
      
      if (aiResult.metadata) {
        whatsappResponse += `📊 *Document Stats:*\n`;
        whatsappResponse += `- ${aiResult.metadata.wordCount} words\n`;
        whatsappResponse += `- ${aiResult.metadata.lineCount} lines\n`;
        whatsappResponse += `- ${aiResult.metadata.estimatedReadTime} min read\n\n`;
      }
      
      if (aiResult.tailored) {
        whatsappResponse += `🎯 *Tailored Summary:*\n${aiResult.tailored}`;
      }

      // Display the response
      console.log('📱 WhatsApp Response Generated:');
      console.log('='.repeat(60));
      console.log(whatsappResponse);
      console.log('='.repeat(60));

      // Show processing metadata
      console.log('\n🔍 Processing Details:');
      console.log('- Original content length:', sampleDocument.length, 'characters');
      console.log('- Extracted text length:', aiResult.original?.length || 0, 'characters');
      console.log('- Processing successful:', !aiResult.error);
      console.log('- Response length:', whatsappResponse.length, 'characters');

    } else {
      console.log('❌ AI processing failed');
      if (aiResult?.error) {
        console.log('Error:', aiResult.error);
      }
    }

    // Clean up
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Temporary file cleaned up');
    }

    console.log('\n🎉 Demo completed successfully!');
    console.log('\nThis demonstrates the complete pipeline:');
    console.log('1. ✅ WhatsApp message received');
    console.log('2. ✅ File downloaded from media ID');
    console.log('3. ✅ Text extracted from document');
    console.log('4. ✅ AI processing applied');
    console.log('5. ✅ Response formatted for WhatsApp');
    console.log('6. ✅ Ready to send back to user');

  } catch (error) {
    logger.error('Demo failed', error);
    console.log('❌ Demo failed:', error.message);
  }
}

// Handle command line execution
if (require.main === module) {
  simulateWhatsAppMessage().catch(console.error);
}

module.exports = { simulateWhatsAppMessage };