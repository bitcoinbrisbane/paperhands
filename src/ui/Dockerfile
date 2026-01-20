# Build stage - produces static files for nginx
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Output is in /app/dist
# This will be copied to host by deployment script
