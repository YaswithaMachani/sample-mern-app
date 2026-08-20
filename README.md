# 🚀 Sample MERN Stack Application (Task Tracker)

A clean, modern **MERN** (MongoDB, Express, React, Node.js) application designed as a hands-on project to practice **Dockerizing full-stack applications**.

---

## 📁 Project Architecture & Layout

```text
sample-mern-app/
├── backend/
│   ├── models/
│   │   └── Task.js          # Mongoose schema
│   ├── routes/
│   │   └── taskRoutes.js    # Express REST API endpoints
│   ├── .env.example         # Environment variable template
│   ├── package.json         # Backend dependencies
│   └── server.js            # Express server entry point & DB connection with retry logic
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # React Task Tracker component + DB health status UI
│   │   ├── index.css        # Responsive dark theme & glassmorphic styling
│   │   └── main.jsx         # React root
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration with API proxy settings
└── README.md                # This guide
```

---

## 💻 1. Running Locally (Without Docker)

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally on `mongodb://localhost:27017` (or via Docker image `docker run -p 27017:27017 mongo`)

### Step 1: Start Backend Server
```bash
cd backend
npm install
npm run dev
```
The backend server will start on **`http://localhost:5000`**. You can verify it by opening `http://localhost:5000/api/health` in your browser.

### Step 2: Start Frontend Development Server
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend application will start on **`http://localhost:3000`**.

---

## 🐳 2. Dockerization Challenge & Guide (Do It Yourself!)

Your goal is to dockerize this 3-tier application: **MongoDB** + **Express Backend** + **React Frontend**.

Here is a recommended roadmap and hints to help you write the Docker configuration files:

---

### Step 2.1: Write `backend/Dockerfile` & `backend/.dockerignore`

<details>
<summary>💡 Click for Backend Dockerfile Hints</summary>

1. **Base Image**: Use `node:18-alpine` for a lightweight Node container.
2. **Working Directory**: Set `WORKDIR /app`.
3. **Dependencies**: Copy `package*.json` first, then run `RUN npm install`. (This optimizes layer caching!).
4. **Copy Source**: Copy the rest of the backend files (`COPY . .`).
5. **Environment Variable**: Set `ENV PORT=5000`.
6. **Expose Port**: `EXPOSE 5000`.
7. **Start Command**: `CMD ["npm", "start"]` or `["node", "server.js"]`.

**.dockerignore contents:**
```
node_modules
.env
npm-debug.log
```
</details>

---

### Step 2.2: Write `frontend/Dockerfile` & `frontend/.dockerignore`

<details>
<summary>💡 Click for Frontend Dockerfile Hints</summary>

**For Development Mode (Vite server):**
1. Use `node:18-alpine` as base image.
2. Set `WORKDIR /app`.
3. Copy `package*.json` and run `npm install`.
4. Copy all frontend source files.
5. Expose port `3000`.
6. Command: `CMD ["npm", "run", "dev"]`.

**.dockerignore contents:**
```
node_modules
dist
.env
.env.local
*.log
```

**For Production Mode (Multi-stage Build - Optional):**
- **Stage 1 (Build)**: Use Node to run `npm run build` (outputs to `dist/`).
- **Stage 2 (Serve)**: Use `nginx:alpine` to host static files from `/usr/share/nginx/html`.
</details>

---

### Step 2.3: Write `docker-compose.yml` in Root Directory

<details>
<summary>💡 Click for docker-compose.yml Hints</summary>

You'll need 3 services: `mongo`, `backend`, and `frontend`.

```yaml
version: '3.8'

services:
  # Service 1: MongoDB Database
  mongo:
    image: mongo:6.0
    container_name: mern_mongo
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - mern-network

  # Service 2: Express Backend API
  backend:
    build: ./backend
    container_name: mern_backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://mongo:27017/merndb   # Note: 'mongo' matches the service name above!
    depends_on:
      - mongo
    networks:
      - mern-network

  # Service 3: React Frontend
  frontend:
    build: ./frontend
    container_name: mern_frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://backend:5000
    depends_on:
      - backend
    networks:
      - mern-network

# Named volume for database persistence
volumes:
  mongo-data:

# Custom bridge network for container-to-container communication
networks:
  mern-network:
    driver: bridge
```
</details>

---

### Useful Commands to Remember

```bash
# Build and start all containers in background
docker compose up --build -d

# Check status of running containers
docker compose ps

# View container logs
docker compose logs -f

# Stop and remove containers, networks
docker compose down

# Stop and remove containers AND data volumes
docker compose down -v
```
