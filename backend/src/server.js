require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const shotRoutes = require('./routes/shotRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const visionRoutes = require('./routes/visionRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO Setup for live telemetry streaming
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ limit: '60mb', extended: true }));

// Serve uploaded sports videos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/shots', shotRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/vision', visionRoutes);

// Root Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'SportTrack Vision Analytics Gateway',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO real-time telemetry relay
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Real-time client connected: ${socket.id}`);

  socket.on('join_session', (sessionId) => {
    socket.join(sessionId);
    console.log(`[Socket.IO] Client ${socket.id} joined session ${sessionId}`);
  });

  socket.on('live_telemetry', (data) => {
    // Broadcast live joint angles, PI, and shot outcomes to coaches/spectators
    socket.broadcast.emit('telemetry_stream', data);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Initialize Database & Start Server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` SPORTTRACK BACKEND API & SOCKET SERVER`);
    console.log(` Server running on: http://localhost:${PORT}`);
    console.log(` REST API Base:     http://localhost:${PORT}/api`);
    console.log(`=======================================================`);
  });
});

