# Use Railway-compatible Node.js image
FROM node:18-slim

# Install Chrome dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libgtk-3-0 \
    libxshmfence1 \
    libnss3 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production && \
    npx puppeteer browsers install chrome --path /app/chrome

# Copy application code
COPY . .

# Set environment variables
ENV PUPPETEER_EXECUTABLE_PATH=/app/chrome/linux-*/chrome-linux*/chrome
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]