FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY .env.example ./.env

RUN npm install --only=production

EXPOSE 3000

# Set environment variable for stdio detection
ENV MCP_STDIO=false

CMD ["node", "dist/index.js"]
