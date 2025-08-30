import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5002;

// Basic middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend
  credentials: true
}));
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

// Mock current user endpoint - the frontend expects /api/auth/user
app.get('/api/auth/user', (req, res) => {
  console.log('Current user requested via /api/auth/user');
  res.json(mockUsers[0]);
});

console.log('Starting simplified server...');

app.listen(PORT, () => {
  console.log(`✓ Server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /api/health - Health check');  
  console.log('  GET /api/auth/user - Get current user');
}).on('error', (err) => {
  console.error('Server error:', err);
});
