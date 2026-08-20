# ==========================================
# STAGE 1: Build React static assets
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source code and compile production bundle into /app/dist
COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Serve React app using Nginx
# ==========================================
FROM nginx:1.25-alpine AS runtime

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config file into Nginx configuration folder
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy compiled static files from STAGE 1 (builder) into Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 (Nginx default port)
EXPOSE 80

# Start Nginx web server in foreground mode
CMD ["nginx", "-g", "daemon off;"]
