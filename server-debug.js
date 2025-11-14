const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'default_token';

console.log('🚀 Starting debug WhatsApp webhook server...');
console.log('📱 Port:', PORT);
console.log('🔑 Webhook token:', WEBHOOK_VERIFY_TOKEN);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  console.log(`📥 ${req.method} ${pathname}`, JSON.stringify(query, null, 2));

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === '/debug') {
    res.writeHead(200);
    res.end(JSON.stringify({
      environment: process.env.NODE_ENV || 'development',
      webhookToken: WEBHOOK_VERIFY_TOKEN,
      port: PORT,
      timestamp: new Date().toISOString(),
      allEnvVars: Object.keys(process.env).filter(key => key.includes('WEBHOOK') || key.includes('WHATSAPP'))
    }, null, 2));
    return;
  }

  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'WhatsApp Business API Bot',
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      webhookToken: WEBHOOK_VERIFY_TOKEN ? 'configured' : 'missing'
    }));
    return;
  }

  if (pathname === '/' || pathname === '') {
    res.writeHead(200);
    res.end(JSON.stringify({
      name: 'WhatsApp Business API Integration',
      version: '1.0.0',
      status: 'running',
      webhookToken: WEBHOOK_VERIFY_TOKEN,
      endpoints: {
        health: '/health',
        webhook: '/webhook',
        debug: '/debug'
      }
    }));
    return;
  }

  if (pathname === '/webhook') {
    if (req.method === 'GET') {
      // Webhook verification
      const mode = query['hub.mode'];
      const token = query['hub.verify_token'];
      const challenge = query['hub.challenge'];

      console.log('🔍 Webhook verification attempt:', { 
        mode, 
        receivedToken: token, 
        expectedToken: WEBHOOK_VERIFY_TOKEN,
        challenge,
        match: token === WEBHOOK_VERIFY_TOKEN
      });

      if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(challenge);
      } else {
        console.log('❌ Webhook verification failed');
        res.writeHead(403);
        res.end(JSON.stringify({ 
          error: 'Verification failed',
          expected: WEBHOOK_VERIFY_TOKEN,
          received: token,
          mode: mode
        }));
      }
      return;
    }

    if (req.method === 'POST') {
      // Handle webhook messages
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        console.log('📨 Received webhook message:', body);
        res.writeHead(200);
        res.end(JSON.stringify({ 
          status: 'received',
          timestamp: new Date().toISOString()
        }));
      });
      return;
    }
  }

  // 404 for all other routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Debug WhatsApp webhook server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Webhook: http://localhost:${PORT}/webhook`);
  console.log(`🔧 Debug: http://localhost:${PORT}/debug`);
  console.log(`🔑 Using webhook token: ${WEBHOOK_VERIFY_TOKEN}`);
  console.log(`✅ Server started successfully at ${new Date().toISOString()}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = server;