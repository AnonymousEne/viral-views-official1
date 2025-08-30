const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Mock data for development
const mockUsers = [
  {
    id: 'user-1',
    username: 'demo_artist',
    email: 'demo@example.com',
    displayName: 'Demo Artist',
    role: 'artist',
    bio: 'A sample artist for development',
    followers: 100,
    following: 50,
  }
];

const mockTracks = [];
const mockBattles = [];
const mockBeats = [];

// Get all users
app.get('/api/users', (req, res) => {
  res.json(mockUsers);
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = mockUsers.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Get all tracks
app.get('/api/tracks', (req, res) => {
  res.json(mockTracks);
});

// Get all battles
app.get('/api/battles', (req, res) => {
  res.json(mockBattles);
});

// Get all beats
app.get('/api/beats', (req, res) => {
  res.json(mockBeats);
});

// Mock authentication endpoints
app.post('/api/auth/login', (req, res) => {
  res.json({ 
    success: true, 
    user: mockUsers[0]
  });
});

// Mock current user endpoint - the frontend expects /api/auth/user
app.get('/api/auth/user', (req, res) => {
  res.json(mockUsers[0]);
});

// Legacy endpoint for backward compatibility
app.get('/api/auth/me', (req, res) => {
  res.json(mockUsers[0]);
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📱 Client running at http://localhost:5173`);
  console.log('✅ Database: Mock data (development)');
  console.log('🔧 Environment: Development');
});
