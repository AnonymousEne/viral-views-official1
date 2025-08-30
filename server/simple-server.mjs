import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
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
  console.log('Users requested');
  res.json(mockUsers);
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  console.log(`User ${id} requested`);
  const user = mockUsers.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Get all tracks
app.get('/api/tracks', (req, res) => {
  console.log('Tracks requested');
  res.json(mockTracks);
});

// Get all battles
app.get('/api/battles', (req, res) => {
  console.log('Battles requested');
  res.json(mockBattles);
});

// Get all beats
app.get('/api/beats', (req, res) => {
  console.log('Beats requested');
  res.json(mockBeats);
});

// Mock authentication endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('Login requested');
  res.json({ 
    success: true, 
    user: mockUsers[0]
  });
});

// Mock current user endpoint - the frontend expects /api/auth/user
app.get('/api/auth/user', (req, res) => {
  console.log('Current user requested via /api/auth/user');
  res.json(mockUsers[0]);
});

// Legacy endpoint for backward compatibility
app.get('/api/auth/me', (req, res) => {
  console.log('Current user requested via /api/auth/me');
  res.json(mockUsers[0]);
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📱 Client running at http://localhost:5173`);
  console.log('✅ Database: Mock data (development)');
  console.log('🔧 Environment: Development');
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET /api/health - Health check');
  console.log('  GET /api/users - Get all users');
  console.log('  GET /api/auth/user - Get current user');
  console.log('  GET /api/tracks - Get all tracks');
  console.log('  GET /api/battles - Get all battles');
  console.log('  GET /api/beats - Get all beats');
});
