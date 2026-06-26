const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const userRoutes = require('./routes/users');
const pinRoutes = require('./routes/pins');
const recommendationRoutes = require('./routes/recommendations');
const marketplaceRoutes = require('./routes/marketplace');
const { bookingRouter } = require('./routes/marketplace');
const packageRoutes = require('./routes/packages');
const waveRoutes = require('./routes/waves');
const safetyRoutes = require('./routes/safety');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const db = require('./config/database');

// Middleware
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) 
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadPath = path.resolve(process.env.UPLOAD_PATH || 'uploads');
app.use('/uploads', express.static(uploadPath));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get(['/health', '/health '], (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'WanderMeets API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pins', pinRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/bookings', bookingRouter);
app.use('/api/packages', packageRoutes);
app.use('/api/waves', waveRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// WebSocket connection handling for real-time updates and group chat
const clients = new Map(); // userId -> WebSocket connection
const rooms = new Map();   // roomId -> Set of userIds

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      // Handle authentication
      if (data.type === 'auth') {
        clients.set(data.userId, ws);
        ws.userId = data.userId;
        console.log(`User ${data.userId} authenticated on WebSocket`);
        ws.send(JSON.stringify({ type: 'auth_success', message: 'Connected to real-time updates' }));
      }

      // GROUP CHAT: Join Room
      if (data.type === 'join_room') {
        const { roomId } = data;
        ws.currentRoom = roomId;
        console.log(`User ${ws.userId} joined room ${roomId}`);
        
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(ws.userId);
        
        ws.send(JSON.stringify({ type: 'room_joined', roomId }));
      }

      // GROUP CHAT: Send Message
      if (data.type === 'group_message') {
        const { roomId, chatRoomId, text } = data;
        
        // 1. Save to Database
        try {
          await db.query(
            'INSERT INTO group_messages (group_chat_id, sender_id, message) VALUES (?, ?, ?)',
            [chatRoomId, ws.userId, text]
          );

          // 2. Broadcast to everyone in the room
          const broadcastMsg = JSON.stringify({
            type: 'new_group_message',
            roomId,
            message: {
              sender_id: ws.userId,
              content: text,
              created_at: new Date().toISOString()
            }
          });

          // Send to all clients subscribed to this room
          const roomParticipants = rooms.get(roomId);
          if (roomParticipants) {
            roomParticipants.forEach(uid => {
              const clientWs = clients.get(uid);
              if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(broadcastMsg);
              }
            });
          }
        } catch (dbErr) {
          console.error('Error saving group message:', dbErr);
        }
      }

      // Legacy notification logic ...
      if (data.type === 'activity_created') {
        broadcast({ type: 'new_activity', activity: data.activity }, ws.userId);
      }
      
      if (data.type === 'activity_rsvp') {
        const hostWs = clients.get(data.hostId);
        if (hostWs && hostWs.readyState === WebSocket.OPEN) {
          hostWs.send(JSON.stringify({
            type: 'new_rsvp',
            activity_id: data.activityId,
            user: data.user
          }));
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      clients.delete(ws.userId);
      // Remove from rooms
      if (ws.currentRoom && rooms.has(ws.currentRoom)) {
        rooms.get(ws.currentRoom).delete(ws.userId);
      }
      console.log(`User ${ws.userId} disconnected from WebSocket`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast to all connected clients except sender
function broadcast(data, excludeUserId) {
  const message = JSON.stringify(data);
  clients.forEach((client, userId) => {
    if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('\n🚀 WanderMeets Backend Server Started!');
  console.log(`📡 HTTP API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, wss };
