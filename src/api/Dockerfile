FROM node:24-alpine

WORKDIR /app

# Install dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
