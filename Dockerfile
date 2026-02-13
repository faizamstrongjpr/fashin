# Use Node.js base image (Debian based)
FROM node:20-bullseye-slim

# Install system dependencies (ffmpeg is CRITICAL for yt-dlp audio processing)
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    wget \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp binary (standard Linux install)
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy package.json (if exists, otherwise create dummy)
# Note: We assume user has `package.json`. If not, we might need adjustments.
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Environment setup
ENV PORT=7860
# HF Spaces expose port 7860 by default

# Start the server
CMD ["node", "server.js"]
