# Stage 1: Build
FROM node:20-alpine AS builder

# 1️⃣ Set working directory
WORKDIR /usr/src/app

# 2️⃣ Copy package.json first
COPY package*.json ./

# 3️⃣ Install all dependencies (including dev)
RUN npm install

# 4️⃣ Copy source files
COPY . .

# 5️⃣ Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /usr/src/app

# 6️⃣ Copy only package.json
COPY package*.json ./

# 7️⃣ Install only production dependencies
RUN npm install --production

# 8️⃣ Copy compiled JS from build stage
COPY --from=builder /usr/src/app/dist ./dist

# 9️⃣ Expose service port
EXPOSE 3002

# 🔟 Start the service
CMD ["node", "dist/index.js"]
