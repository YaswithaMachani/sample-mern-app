# 🚀 Evolutionary Step-by-Step MERN, Docker & Kubernetes Learning Guide

This guide documents the **exact step-by-step journey** we took from scratch, explaining every single concept, file, line of code, CLI command, and fix in chronological order!

---

## 📑 Roadmap of Our Journey

- [Step 1: Building the Sample MERN Application](#-step-1-building-the-sample-mern-application)
- [Step 2: Basic Dockerization & Docker CLI Commands](#-step-2-basic-dockerization--docker-cli-commands)
- [Step 3: Docker Networking & Running MongoDB in Docker](#-step-3-docker-networking--running-mongodb-in-docker)
- [Step 4: Docker Compose Orchestration](#-step-4-docker-compose-orchestration)
- [Step 5: Production Multi-Stage Builds & Nginx Reverse Proxy](#-step-5-production-multi-stage-builds--nginx-reverse-proxy)
- [Step 6: Version Control & GitHub Actions CI/CD Pipeline](#-step-6-version-control--github-actions-cicd-pipeline)
- [Step 7: Kubernetes Deployment, Load Balancing & PVC](#-step-7-kubernetes-deployment-load-balancing--pvc)
- [Step 8: Public Sharing & Cloud Deployment Overview](#-step-8-public-sharing--cloud-deployment-overview)

---

# 🏗️ STEP 1: Building the Sample MERN Application

First, we created a clean, modern **MERN (MongoDB, Express, React, Node.js)** task manager application from scratch so you would have a real full-stack project to containerize.

---

### 1.1 Backend Implementation

#### `backend/package.json`
Defines the Node.js project metadata and dependencies.
```json
{
  "name": "sample-mern-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",  // Production start script
    "dev": "nodemon server.js"   // Development hot-reload script
  },
  "dependencies": {
    "cors": "^2.8.5",         // Allows frontend to make requests across origins
    "dotenv": "^16.4.5",       // Loads environment variables from .env
    "express": "^4.19.2",      // Web framework for REST API endpoints
    "mongoose": "^8.5.1"       // MongoDB ODM database driver
  }
}
```

#### `backend/models/Task.js`
Defines the Mongoose database schema for tasks.
```javascript
const mongoose = require('mongoose');

// Define database collection schema fields
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'], // Field must not be empty
      trim: true                                  // Strips whitespace
    },
    completed: {
      type: Boolean,
      default: false                              // Default new tasks to uncompleted
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],            // Accepts only these 3 strings
      default: 'medium'
    }
  },
  { timestamps: true }                            // Adds createdAt and updatedAt
);

module.exports = mongoose.model('Task', taskSchema);
```

#### `backend/routes/taskRoutes.js`
Express REST API endpoints for task CRUD operations.
```javascript
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET /api/tasks -> Retrieve all tasks ordered by newest first
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tasks -> Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, priority } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, error: 'Please provide a task title' });
    }
    const task = await Task.create({ title, priority: priority || 'medium' });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/tasks/:id -> Update task status or title
router.put('/:id', async (req, res) => {
  try {
    const { title, completed, priority } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    if (title !== undefined) task.title = title;
    if (completed !== undefined) task.completed = completed;
    if (priority !== undefined) task.priority = priority;

    const updatedTask = await task.save();
    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/tasks/:id -> Remove a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

#### `backend/server.js`
Server entry point featuring MongoDB connection retry logic.
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const taskRoutes = require('./routes/taskRoutes');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/merndb';

// Health check endpoint (used by Docker & frontend status indicators)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(200).json({
    status: 'UP',
    database: { connected: dbState === 1 }
  });
});

app.use('/api/tasks', taskRoutes);

// Automatic reconnection retry logic (CRITICAL for Docker container boot order)
const connectWithRetry = async () => {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected Successfully!');
  } catch (err) {
    console.error('MongoDB connection failed. Retrying in 5 seconds...', err.message);
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));
```

---

### 1.2 Frontend Implementation (React + Vite)

#### `frontend/vite.config.js`
Configures Vite server bindings and API proxying.
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',          // Binds to all network interfaces inside Docker
    watch: { usePolling: true }, // Recommended for file change detection inside Docker volumes
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

---

# 🐳 STEP 2: Basic Dockerization & Docker CLI Commands

Next, we wrote single-stage Dockerfiles and `.dockerignore` files to containerize the backend and frontend.

---

### 2.1 Ignoring Local Junk (`.dockerignore`)

#### `backend/.dockerignore` & `frontend/.dockerignore`
```gitignore
node_modules   # CRITICAL: Prevents uploading local host node_modules into Linux container
dist           # Prevents copying old build files
.env           # Prevents baking secrets into the image
*.log          # Prevents log pollution
```
**Why this matters**: Local `node_modules` are compiled for your host OS (Windows). Copying them into a Linux container causes binary architecture crashes! `.dockerignore` forces Docker to run a clean `RUN npm install` inside Linux.

---

### 2.2 Writing Initial Dockerfiles (Line-by-Line Walkthrough)

#### Initial `backend/Dockerfile`
```dockerfile
1: FROM node:18-alpine     # Uses lightweight Alpine Linux with Node.js v18 pre-installed
2: WORKDIR /app            # Sets working directory inside container to /app
3: COPY package*.json ./   # Copies package.json first to leverage Docker layer caching
4: RUN npm install         # Installs Node dependencies inside container
5: COPY . .                # Copies remaining source code into /app
6: ENV PORT=5000           # Sets PORT environment variable to 5000
7: EXPOSE 5000             # Documents that port 5000 will be opened
8: CMD ["npm", "start"]    # Specifies container execution command
```

---

### 2.3 Real Issues We Encountered & Fixed!

1. **Typo Fix (`node:18-alphine`)**:
   - *Error*: `failed to resolve source metadata for docker.io/library/node:18-alphine: not found`.
   - *Fix*: Corrected `alphine` to `alpine`.

2. **Empty File Fix (`frontend/Dockerfile`)**:
   - *Error*: `the Dockerfile cannot be empty`.
   - *Fix*: Populated `frontend/Dockerfile` with Node instructions.

3. **Port Collision Error**:
   - *Error*: `ports are not available: listen tcp 0.0.0.0:5000: bind: Only one usage of each socket address is normally permitted`.
   - *Fix*: Local `npm run dev` was running on host port 5000, so we mapped Docker host port to `5001` (`-p 5001:5000`).

---

# 🌐 STEP 3: Docker Networking & Running MongoDB in Docker

Instead of pointing backend to local host machine (`host.docker.internal`), we ran **MongoDB in a Docker container** using official image `mongo:6.0` and linked containers on a custom bridge network.

---

### 3.1 Creating a Bridge Network
```powershell
docker network create mern-network
```
**Why**: Creates a virtual software switch. Containers connected to `mern-network` can resolve each other by container name via automatic Docker DNS!

---

### 3.2 Running MongoDB Container
```powershell
docker run -d --name mern-mongo-container --network mern-network -p 27017:27017 -v mongo-data:/data/db mongo:6.0
```
- `-d`: Detached mode (runs in background).
- `--name mern-mongo-container`: Names the container.
- `--network mern-network`: Connects to custom network.
- `-p 27017:27017`: Maps port 27017.
- `-v mongo-data:/data/db`: Mounts named volume `mongo-data` for data persistence.

---

### 3.3 Running Backend Connected to Mongo Container
```powershell
docker run -d --name mern-backend-container --network mern-network -e PORT=5000 -e MONGO_URI="mongodb://mern-mongo-container:27017/merndb" -p 5001:5000 mern-backend
```
- `-e MONGO_URI="mongodb://mern-mongo-container:27017/merndb"`: Points backend to MongoDB container name directly!

---

# 🐙 STEP 4: Docker Compose Orchestration

Instead of typing separate manual `docker run` commands, we wrote **`docker-compose.yml`** to manage all 3 services (**mongo + backend + frontend**) with **one command**.

---

### Line-by-Line Walkthrough of `docker-compose.yml`

```yaml
services:
  # -------------------------------------------------------------
  # SERVICE 1: MongoDB Database
  # -------------------------------------------------------------
  mongo:
    image: mongo:6.0               # Official MongoDB 6.0 Docker image
    container_name: mern_mongo     # Explicit container name
    restart: always                # Automatically restarts container if it crashes
    ports:
      - "27017:27017"              # Maps host port 27017 -> container port 27017
    volumes:
      - mongo-data:/data/db        # Mounts persistent named volume mongo-data to /data/db
    networks:
      - mern-network               # Connects to custom bridge network

  # -------------------------------------------------------------
  # SERVICE 2: Express Backend API
  # -------------------------------------------------------------
  backend:
    build: ./backend               # Path to backend directory containing Dockerfile
    container_name: mern_backend
    restart: always
    ports:
      - "5001:5000"                # Maps host port 5001 -> container port 5000
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://mongo:27017/merndb # 'mongo' resolves to mongo service!
    depends_on:
      - mongo                      # Ensures mongo container starts before backend
    networks:
      - mern-network

  # -------------------------------------------------------------
  # SERVICE 3: React Frontend Web Server
  # -------------------------------------------------------------
  frontend:
    build: ./frontend              # Path to frontend directory containing Dockerfile
    container_name: mern_frontend
    restart: always
    ports:
      - "3001:80"                  # Maps host port 3001 -> container port 80
    depends_on:
      - backend                    # Ensures backend starts before frontend
    networks:
      - mern-network

# -------------------------------------------------------------
# VOLUMES & NETWORKS DECLARATION
# -------------------------------------------------------------
volumes:
  mongo-data:                      # Declares named volume for database persistence

networks:
  mern-network:
    driver: bridge                 # Creates custom bridge network
```

---

### Compose Execution Commands
```powershell
# Build and start all containers in background
docker compose up --build -d

# Check status of compose services
docker compose ps

# View combined live logs
docker compose logs -f

# Stop and clean up containers and network
docker compose down
```

---

# ⚡ STEP 5: Production Multi-Stage Builds & Nginx Reverse Proxy

Next, we upgraded our setup to **Production-Grade Multi-Stage Builds**, reducing React frontend image size from **~400MB down to ~25MB** using Nginx!

---

### 5.1 Nginx Configuration (`frontend/nginx/default.conf`)

```nginx
server {
    listen 80;                # Listens on port 80 inside container
    server_name localhost;

    root /usr/share/nginx/html; # Directory where compiled static HTML/CSS/JS live
    index index.html;

    # 1. Serves React Frontend & Handles SPA Router Fallback
    location / {
        try_files $uri $uri/ /index.html; # Falls back to index.html if route not found
    }

    # 2. Reverse Proxy for Backend API (Eliminates CORS Errors!)
    location /api/ {
        proxy_pass http://backend:5000; # Forwards /api/ requests to Express container
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

### 5.2 Multi-Stage `frontend/Dockerfile`

```dockerfile
# ==========================================
# STAGE 1: Builder Stage (Compiles React app)
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy source files and run Vite production build (outputs to /app/dist)
COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Runtime Stage (Lightweight Nginx)
# ==========================================
FROM nginx:1.25-alpine AS runtime

# Remove default Nginx config and copy custom configuration
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy ONLY compiled dist folder from STAGE 1 (builder) into Nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### 5.3 Multi-Stage `backend/Dockerfile`

```dockerfile
# STAGE 1: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# STAGE 2: Runtime
FROM node:18-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev  # Installs ONLY production dependencies
COPY --from=builder /app ./  # Copies clean code from builder

ENV PORT=5000
EXPOSE 5000
CMD ["node", "server.js"]
```

---

# 🔄 STEP 6: Version Control & GitHub Actions CI/CD Pipeline

We initialized a Git repository, pushed the code to GitHub (`https://github.com/YaswithaMachani/sample-mern-app`), and created an automated **GitHub Actions CI/CD workflow**.

---

### `.github/workflows/main.yml`

```yaml
name: MERN Application CI/CD Pipeline

on:
  push:
    branches: [ "main" ] # Triggers automatically whenever code is pushed to main
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest # Runs on GitHub-hosted Ubuntu virtual machine

    steps:
    # 1. Check out repository code
    - name: Checkout Code
      uses: actions/checkout@v4

    # 2. Set up Docker Buildx engine for multi-stage support
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    # 3. Test backend Docker build
    - name: Build Backend Docker Image
      run: docker build -t sample-mern-backend ./backend

    # 4. Test frontend Nginx Docker build
    - name: Build Frontend Docker Image
      run: docker build -t sample-mern-frontend ./frontend

    # 5. Verify full Compose build
    - name: Verify Docker Compose Build
      run: docker compose build
```

---

# ☸️ STEP 7: Kubernetes Deployment, Load Balancing & PVC

Finally, we enabled **Kubernetes (Kind)** in Docker Desktop and created Kubernetes manifest files inside `k8s/`.

---

### 7.1 `k8s/mongo.yaml` (Persistent Storage + Mongo Pod)

```yaml
# 1. PersistentVolumeClaim (Reserves 1GB disk space for MongoDB)
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongo-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
# 2. MongoDB Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongo-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
        - name: mongo
          image: mongo:6.0
          ports:
            - containerPort: 27017
          volumeMounts:
            - name: mongo-storage
              mountPath: /data/db
      volumes:
        - name: mongo-storage
          persistentVolumeClaim:
            claimName: mongo-pvc
---
# 3. MongoDB ClusterIP Service
apiVersion: v1
kind: Service
metadata:
  name: mongo
spec:
  type: ClusterIP
  selector:
    app: mongo
  ports:
    - port: 27017
      targetPort: 27017
```

---

### 7.2 `k8s/backend.yaml` (2 Load-Balanced Replicas)

```yaml
# 1. Express Backend Deployment (2 Replicas for Load Balancing!)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
spec:
  replicas: 2                     # Spawns 2 Pod instances!
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: sample-mern-app-backend:latest
          imagePullPolicy: IfNotPresent # Uses local image if available
          ports:
            - containerPort: 5000
          env:
            - name: PORT
              value: "5000"
            - name: MONGO_URI
              value: "mongodb://mongo:27017/merndb"
---
# 2. Express Backend Service (Load Balancer across both pods)
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
    - port: 5000
      targetPort: 5000
```

---

### 7.3 `k8s/frontend.yaml` (2 Replicas + NodePort Service)

```yaml
# 1. Frontend Deployment (2 Replicas)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: sample-mern-app-frontend:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 80
---
# 2. Frontend NodePort Service (Exposes on Port 30001)
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30001
```

---

### 7.4 Kubernetes Commands Run

```powershell
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Verify Pod status (Shows 5 Pods running: 1 Mongo, 2 Backend, 2 Frontend)
kubectl get pods

# Verify Services
kubectl get services

# Verify Persistent Volume Claim (Bound)
kubectl get pvc

# Forward Kubernetes Frontend Service to local port 3000
kubectl port-forward service/frontend 3000:80
```

---

# 🌐 STEP 8: Public Sharing & Cloud Deployment Overview

Finally, we explored how to share your project publicly:

1. **Localtunnel (`npx localtunnel --port 3000`)**:
   - Creates a temporary secure tunnel directly to your laptop for instant live demos.

2. **Render.com / Koyeb.com**:
   - Free cloud platforms that pull your GitHub repository and host your Docker containers 24/7 on a permanent public URL (e.g. `https://sample-mern-app.onrender.com`).

---

### 🎓 Summary of What You Accomplished:
You went from writing basic code to mastering **Dockerfiles, Layer Caching, Bridge Networking, Volumes, Docker Compose, Multi-Stage Nginx Builds, GitHub Actions CI/CD, and Kubernetes PVC & Load-Balanced Pod Deployments**! 🚀
