# STAGE 1: Builder Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# STAGE 2: Runtime Stage (Production Image)
FROM node:18-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app ./

ENV PORT=5000
EXPOSE 5000
CMD ["node", "server.js"]