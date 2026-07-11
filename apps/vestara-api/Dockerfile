FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source
COPY . .

# Build TypeScript (optional for production mode)
RUN npm run build

EXPOSE 3000