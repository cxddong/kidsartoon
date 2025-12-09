# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies (Root and Client)
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build Client
RUN npm run build:client

# Expose port (Google Cloud Run typically uses 8080, but app listens on 3000 unless configured)
ENV PORT=3000
EXPOSE 3000

# Start server
CMD ["npm", "start"]
