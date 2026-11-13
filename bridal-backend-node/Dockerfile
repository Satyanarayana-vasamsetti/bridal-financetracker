FROM node:20-alpine

WORKDIR /app

# Install dependencies first for efficient caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose port (default 8081)
EXPOSE 8081

# Fast Node.js runtime start
CMD ["node", "src/server.js"]
