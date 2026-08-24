# 📋 Master DevOps Commands Cheatsheet

A complete reference guide containing all Docker, Docker Compose, Docker Swarm, Kubernetes, Git, and Cloud deployment commands used in this project, complete with detailed explanations of what each command does.

---

## 📑 Table of Contents

1. [Basic Verification Commands](#1-basic-verification-commands)
2. [Docker Image Commands](#2-docker-image-commands-building--managing)
3. [Docker Container Commands](#3-docker-container-commands-running--debugging)
4. [Docker Volume Commands](#4-docker-volume-commands-data-persistence)
5. [Docker Network Commands](#5-docker-network-commands-communication)
6. [Docker Compose Commands](#6-docker-compose-commands-multi-container)
7. [Docker Swarm Commands](#7-docker-swarm-commands-native-clustering)
8. [Kubernetes Commands](#8-kubernetes-commands-kubectl)
9. [Git & GitHub Commands](#9-git--github-commands)
10. [Public Sharing & Tunneling Commands](#10-public-sharing--tunneling-commands)
11. [Cleanup & Memory Recovery Commands](#11-cleanup--memory-recovery-commands)

---

## 🛠️ 1. Basic Verification Commands

```powershell
# Check installed Docker version
docker --version

# View system-wide info about Docker engine, memory, containers, and images
docker info

# Run test container to verify Docker daemon is operational
docker run hello-world
```

---

## 📦 2. Docker Image Commands (Building & Managing)

```powershell
# Build a Docker image from Dockerfile in current folder and tag it
docker build -t mern-backend ./backend
docker build -t mern-frontend ./frontend

# Build an image using a specific custom Dockerfile path
docker build -t custom-app -f ./path/to/Dockerfile .

# List all Docker images stored on your computer
docker images

# Download an official image from Docker Hub without running it
docker pull mongo:6.0

# Tag a local image for pushing to Docker Hub / Registry
docker tag mern-backend:latest yourusername/mern-backend:latest

# Push image to Docker Hub repository
docker push yourusername/mern-backend:latest

# Delete a specific image from local storage
docker rmi mern-backend

# View layer history of an image
docker history mern-backend
```

---

## 🏃 3. Docker Container Commands (Running & Debugging)

```powershell
# Run a container in detached/background mode (-d) with port mapping (-p) and custom name
docker run -d --name mern-backend-container -p 5001:5000 mern-backend

# Run container passing environment variables (-e)
docker run -d --name mern-backend-container -e PORT=5000 -e MONGO_URI="mongodb://mongo:27017/merndb" -p 5001:5000 mern-backend

# Run container mounting a persistent volume (-v)
docker run -d --name mern-mongo-container -p 27017:27017 -v mongo-data:/data/db mongo:6.0

# List currently RUNNING containers
docker ps

# List ALL containers (including stopped/exited)
docker ps -a

# View container logs
docker logs mern-backend-container

# Stream live container logs in real time
docker logs -f mern-backend-container

# Open an interactive shell inside a running container
docker exec -it mern-backend-container sh

# View CPU, Memory, and Network statistics for running containers
docker stats

# Stop a running container
docker stop mern-backend-container

# Start a stopped container
docker start mern-backend-container

# Restart a running container
docker restart mern-backend-container

# Delete a stopped container
docker rm mern-backend-container

# Forcefully stop and delete a running container
docker rm -f mern-backend-container
```

---

## 💾 4. Docker Volume Commands (Data Persistence)

```powershell
# List all persistent volumes managed by Docker
docker volume ls

# Manually create a new volume
docker volume create mongo-data

# Inspect physical disk location where volume data is stored
docker volume inspect mongo-data

# Delete a specific unused volume
docker volume rm mongo-data

# Delete all unused volumes
docker volume prune
```

---

## 🌐 5. Docker Network Commands (Communication)

```powershell
# Create a custom bridge network for container-to-container communication via DNS names
docker network create mern-network

# List all networks (bridge, host, none)
docker network ls

# Inspect network to see connected container IP addresses
docker network inspect mern-network

# Connect a container to a network
docker network connect mern-network container-name

# Disconnect a container from a network
docker network disconnect mern-network container-name

# Delete a network
docker network rm mern-network
```

---

## 🐙 6. Docker Compose Commands (Multi-Container)

```powershell
# Build and start all services defined in docker-compose.yml in background mode
docker compose up --build -d

# View status of services managed by Docker Compose
docker compose ps

# Stream live logs from all services combined
docker compose logs -f

# View logs for a specific service
docker compose logs backend

# Execute command inside a compose service container
docker compose exec backend sh

# Stop running containers without deleting them
docker compose stop

# Start stopped containers
docker compose start

# Stop and remove containers and network
docker compose down

# Stop and remove containers, networks, AND persistent volumes!
docker compose down -v
```

---

## 🐝 7. Docker Swarm Commands (Native Clustering)

```powershell
# Initialize Swarm Mode on current machine as Manager Node
docker swarm init

# Deploy a Compose stack to Docker Swarm
docker stack deploy -c docker-compose.yml mern_swarm

# List all running Swarm stacks
docker stack ls

# List running tasks/containers in a Swarm stack
docker stack ps mern_swarm

# List Swarm services and replica counts
docker service ls

# Scale a Swarm service to 3 container replicas across the cluster
docker service scale mern_swarm_backend=3

# Remove a Swarm stack
docker stack rm mern_swarm

# Leave Swarm Mode
docker swarm leave --force
```

---

## ☸️ 8. Kubernetes Commands (`kubectl`)

```powershell
# View Kubernetes cluster info
kubectl cluster-info

# List all cluster nodes
kubectl get nodes

# Apply/deploy all Kubernetes manifest files in k8s/ directory
kubectl apply -f k8s/

# View running Kubernetes Pods
kubectl get pods

# View exposed Services (ClusterIP, NodePort, LoadBalancer)
kubectl get services

# View Persistent Volume Claims (PVC)
kubectl get pvc

# Detailed diagnostic logs for a Pod (great for debugging ErrImageNeverPull or CrashLoopBackOff)
kubectl describe pod pod-name

# View console logs of a specific Pod
kubectl logs pod-name

# Forward local port 3000 to cluster frontend service port 80
kubectl port-forward service/frontend 3000:80

# Manually scale backend deployment to 5 Pod replicas
kubectl scale deployment/backend-deployment --replicas=5

# Delete all resources defined in k8s/ directory from cluster
kubectl delete -f k8s/
```

---

## 🐙 9. Git & GitHub Commands

```powershell
# Initialize Git repository
git init

# Add all changed files to staging area
git add .

# Commit staged changes with message
git commit -m "Add Docker and Kubernetes setup"

# Set default branch name to main
git branch -M main

# Link local repository to GitHub remote URL
git remote add origin https://github.com/YaswithaMachani/sample-mern-app.git

# Push changes to GitHub main branch
git push -u origin main
```

---

## 🌐 10. Public Sharing & Tunneling Commands

```powershell
# Instantly create a temporary public HTTPS link to your local port 3000
npx localtunnel --port 3000
```

---

## 🧹 11. Cleanup & Memory Recovery Commands

```powershell
# Remove all stopped containers
docker container prune

# Remove all dangling/unnamed images
docker image prune

# Remove stopped containers, unused networks, and dangling images
docker system prune

# NUKE OPTION: Delete all unused containers, images, networks, AND volumes to reclaim maximum disk space!
docker system prune -a --volumes
```
