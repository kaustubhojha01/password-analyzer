FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install --prefix backend --omit=dev

# Copy application source
COPY . .

# Expose port
EXPOSE 4000
ENV PORT=4000
ENV NODE_ENV=production

# Start fullstack server
CMD ["node", "backend/server.js"]
