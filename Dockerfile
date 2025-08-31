# Use official Node.js image as the base
FROM node:22-alpine as build

# Set working directory
WORKDIR /app

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy client and server code
COPY client ./client
COPY server ./server
COPY shared ./shared

# Build frontend
WORKDIR /app/client
RUN npm install --production && npm run build

# Prepare production image
FROM node:22-alpine as production
WORKDIR /app

# Copy only necessary files from build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
COPY --from=build /app/client/dist ./client/dist

# Set environment variables
ENV NODE_ENV=production

# Expose port (change if your server uses a different port)
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]
