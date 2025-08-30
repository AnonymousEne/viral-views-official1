import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { users, tracks, battles, beats } from './sqlite-schema.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.select().from(users).where(eq(users.id, id));
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tracks
app.get('/api/tracks', async (req, res) => {
  try {
    const allTracks = await db.select().from(tracks);
    res.json(allTracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all battles
app.get('/api/battles', async (req, res) => {
  try {
    const allBattles = await db.select().from(battles);
    res.json(allBattles);
  } catch (error) {
    console.error('Error fetching battles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all beats
app.get('/api/beats', async (req, res) => {
  try {
    const allBeats = await db.select().from(beats);
    res.json(allBeats);
  } catch (error) {
    console.error('Error fetching beats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock authentication endpoints
app.post('/api/auth/login', (req, res) => {
  res.json({ 
    success: true, 
    user: { 
      id: 'user-1', 
      username: 'demo_artist', 
      displayName: 'Demo Artist',
      role: 'artist'
    } 
  });
});

// Mock current user endpoint - the frontend expects /api/auth/user
app.get('/api/auth/user', (req, res) => {
  res.json({ 
    id: 'user-1', 
    username: 'demo_artist', 
    displayName: 'Demo Artist',
    role: 'artist',
    email: 'demo@example.com'
  });
});

// Legacy endpoint for backward compatibility
app.get('/api/auth/me', (req, res) => {
  res.json({ 
    id: 'user-1', 
    username: 'demo_artist', 
    displayName: 'Demo Artist',
    role: 'artist',
    email: 'demo@example.com'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📱 Client running at http://localhost:5173`);
  console.log('✅ Database: SQLite (local development)');
  console.log('🔧 Environment: Development');
});
