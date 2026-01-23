# Build stage - produces static files for nginx
FROM node:24-alpine

WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_API_URL=http://localhost:8080
ARG VITE_API2_URL=http://localhost:8081

# Set as environment variables for the build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API2_URL=$VITE_API2_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN echo "Building with VITE_API_URL=$VITE_API_URL VITE_API2_URL=$VITE_API2_URL" && npm run build

# Output is in /app/dist
# This will be copied to host by deployment script
