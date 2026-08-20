const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/merndb';

// Health check endpoint (useful for Docker HEALTHCHECK and frontend status)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    database: {
      status: dbStatusMap[dbState] || 'Unknown',
      connected: dbState === 1
    }
  });
});

// Routes
app.use('/api/tasks', taskRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// MongoDB Connection with retry logic (ideal for Docker setup)
const connectWithRetry = async () => {
  console.log(`Attempting to connect to MongoDB at: ${MONGO_URI}`);
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected Successfully!');
  } catch (err) {
    console.error('MongoDB connection failed. Retrying in 5 seconds...', err.message);
    setTimeout(connectWithRetry, 5000);
  }
};

// Start Connection & Server
connectWithRetry();

app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on port ${PORT}`);
});
