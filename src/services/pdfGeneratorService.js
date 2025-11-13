const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class PDFGeneratorService {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'generated');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a professional PDF report from AI-processed content
   * @param {Object} aiResult - The AI processing result
   * @param {string} originalFilename - Original filename
   * @param {string} userPhone - User's phone number for tracking
   * @returns {Promise<string>} - Path to generated PDF
   */
  async generateProcessedContentPDF(aiResult, originalFilename, userPhone) {
    try {
      logger.info('Starting PDF generation', {
        originalFilename,
        userPhone,
        contentLength: aiResult.original?.length || 0
      });

      const htmlContent = this.createHTMLTemplate(aiResult, originalFilename);
      const pdfPath = await this.convertHTMLToPDF(htmlContent, originalFilename, userPhone);
      
      logger.info('PDF generation completed', {
        pdfPath,
        originalFilename,
        userPhone
      });

      return pdfPath;
    } catch (error) {
      logger.error('PDF generation failed', {
        error: error.message,
        originalFilename,
        userPhone
      });
      throw error;
    }
  }

  /**
   * Create professional HTML template for the PDF
   * @param {Object} aiResult - AI processing result
   * @param {string} originalFilename - Original filename
   * @returns {string} - HTML content
   */
  createHTMLTemplate(aiResult, originalFilename) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const metadata = aiResult.metadata || {};
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Document Analysis Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .document-info {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 0 8px 8px 0;
        }
        
        .document-info h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 20px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .info-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .info-item strong {
            color: #667eea;
            display: block;
            margin-bottom: 5px;
        }
        
        .section {
            margin-bottom: 35px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .section-header {
            background: #667eea;
            color: white;
            padding: 20px;
            font-size: 20px;
            font-weight: bold;
        }
        
        .section-content {
            padding: 25px;
        }
        
        .summary-text {
            font-size: 16px;
            line-height: 1.8;
            color: #555;
        }
        
        .key-points {
            list-style: none;
            padding: 0;
        }
        
        .key-points li {
            background: #f8f9fa;
            margin-bottom: 12px;
            padding: 15px;
            border-left: 4px solid #28a745;
            border-radius: 0 6px 6px 0;
            position: relative;
        }
        
        .key-points li:before {
            content: "→";
            color: #28a745;
            font-weight: bold;
            font-size: 18px;
            position: absolute;
            left: -12px;
            background: white;
            padding: 0 5px;
        }
        
        .action-items {
            list-style: none;
            padding: 0;
        }
        
        .action-items li {
            background: #fff3cd;
            margin-bottom: 12px;
            padding: 15px;
            border-left: 4px solid #ffc107;
            border-radius: 0 6px 6px 0;
            position: relative;
        }
        
        .action-items li:before {
            content: "✓";
            color: #ffc107;
            font-weight: bold;
            font-size: 18px;
            position: absolute;
            left: -12px;
            background: white;
            padding: 0 5px;
        }
        
        .original-content {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.4;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #dee2e6;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 2px solid #e9ecef;
            padding-top: 20px;
        }
        
        .footer strong {
            color: #667eea;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            
            .section {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            .header {
                page-break-after: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 AI Document Analysis Report</h1>
        <p>Intelligent processing and analysis powered by WhatsApp Business AI Bot</p>
    </div>

    <div class="document-info">
        <h2>📋 Document Information</h2>
        <div class="info-grid">
            <div class="info-item">
                <strong>Original Filename</strong>
                ${originalFilename || 'Unknown'}
            </div>
            <div class="info-item">
                <strong>Processing Date</strong>
                ${currentDate}
            </div>
            <div class="info-item">
                <strong>Word Count</strong>
                ${metadata.wordCount || 'N/A'} words
            </div>
            <div class="info-item">
                <strong>Estimated Read Time</strong>
                ${metadata.estimatedReadTime || 'N/A'} minutes
            </div>
            <div class="info-item">
                <strong>Document Structure</strong>
                ${metadata.hasStructure ? 'Well Structured' : 'Plain Text'}
            </div>
            <div class="info-item">
                <strong>Line Count</strong>
                ${metadata.lineCount || 'N/A'} lines
            </div>
        </div>
    </div>

    ${aiResult.summary ? `
    <div class="section">
        <div class="section-header">📋 Executive Summary</div>
        <div class="section-content">
            <div class="summary-text">
                ${this.escapeHTML(aiResult.summary)}
            </div>
        </div>
    </div>` : ''}

    ${aiResult.keyPoints && aiResult.keyPoints.length > 0 ? `
    <div class="section">
        <div class="section-header">🔑 Key Points</div>
        <div class="section-content">
            <ul class="key-points">
                ${aiResult.keyPoints.map(point => `<li>${this.escapeHTML(point)}</li>`).join('')}
            </ul>
        </div>
    </div>` : ''}

    ${aiResult.actionItems && aiResult.actionItems.length > 0 ? `
    <div class="section">
        <div class="section-header">✅ Action Items</div>
        <div class="section-content">
            <ul class="action-items">
                ${aiResult.actionItems.map(item => `<li>${this.escapeHTML(item)}</li>`).join('')}
            </ul>
        </div>
    </div>` : ''}

    ${aiResult.original ? `
    <div class="section">
        <div class="section-header">📄 Original Content</div>
        <div class="section-content">
            <div class="original-content">${this.escapeHTML(aiResult.original)}</div>
        </div>
    </div>` : ''}

    <div class="footer">
        <p>Generated by <strong>WhatsApp Business AI Bot</strong></p>
        <p>This document contains AI-processed analysis and may require human review for accuracy.</p>
    </div>
</body>
</html>`;
  }

  /**
   * Convert HTML content to PDF using Puppeteer
   * @param {string} htmlContent - HTML content to convert
   * @param {string} originalFilename - Original filename
   * @param {string} userPhone - User's phone number
   * @returns {Promise<string>} - Path to generated PDF
   */
  async convertHTMLToPDF(htmlContent, originalFilename, userPhone) {
    let browser = null;

    try {
      // Launch Puppeteer browser
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();

      // Set content and wait for load
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseFilename = originalFilename ? 
        originalFilename.replace(/\.[^/.]+$/, '') : 
        'document';
      const pdfFilename = `AI-Analysis-${baseFilename}-${timestamp}.pdf`;
      const pdfPath = path.join(this.outputDir, pdfFilename);

      // Generate PDF
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px'
        },
        printBackground: true,
        preferCSSPageSize: true
      });

      logger.info('PDF generated successfully', {
        pdfPath,
        pdfFilename,
        originalFilename,
        userPhone
      });

      return pdfPath;

    } catch (error) {
      logger.error('Error converting HTML to PDF', {
        error: error.message,
        originalFilename,
        userPhone
      });
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHTML(text) {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }

  /**
   * Clean up generated PDFs older than specified hours
   * @param {number} hoursOld - Hours old to consider for cleanup
   */
  async cleanupOldPDFs(hoursOld = 24) {
    try {
      const files = fs.readdirSync(this.outputDir);
      const now = Date.now();
      const maxAge = hoursOld * 60 * 60 * 1000; // Convert to milliseconds

      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.pdf')) {
          const filePath = path.join(this.outputDir, file);
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            deletedCount++;
            logger.info('Cleaned up old PDF', { filePath });
          }
        }
      }

      if (deletedCount > 0) {
        logger.info('PDF cleanup completed', { 
          deletedCount,
          hoursOld 
        });
      }

    } catch (error) {
      logger.error('Error during PDF cleanup', {
        error: error.message,
        hoursOld
      });
    }
  }

  /**
   * Get file size in a human readable format
   * @param {string} filePath - Path to file
   * @returns {string} - Human readable file size
   */
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const bytes = stats.size;
      
      if (bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    } catch (error) {
      return 'Unknown size';
    }
  }
}

module.exports = PDFGeneratorService;