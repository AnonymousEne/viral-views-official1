import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Basic middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend
  credentials: true
}));
app.use(express.json());

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

const mockTracks = [
  {
    id: 'track-1',
    title: 'Demo Track',
    description: 'A sample track for development',
    userId: 'user-1',
    audioUrl: 'https://example.com/demo.mp3',
    imageUrl: 'https://example.com/demo.jpg',
    tags: ['demo', 'hip-hop'],
    genre: 'hip-hop',
    plays: 150,
    likes: 25,
    createdAt: new Date().toISOString()
  }
];

const mockBattles = [
  {
    id: 'battle-1',
    title: 'Demo Battle',
    description: 'A sample battle for development',
    creatorId: 'user-1',
    status: 'active',
    participants: [],
    prize: '100',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    createdAt: new Date().toISOString()
  }
];

const mockBeats = [
  {
    id: 'beat-1',
    title: 'Demo Beat',
    description: 'A sample beat for development',
    producerId: 'user-1',
    audioUrl: 'https://example.com/beat.mp3',
    price: '50',
    tags: ['trap', 'dark'],
    bpm: 140,
    key: 'Am',
    licensed: false,
    createdAt: new Date().toISOString()
  }
];

const mockCollaborations = [
  {
    id: 'collab-1',
    title: 'Demo Collaboration',
    description: 'Looking for a rapper for this beat',
    creatorId: 'user-1',
    type: 'beat_collaboration',
    status: 'open',
    participants: [],
    requirements: 'Looking for experienced rapper',
    createdAt: new Date().toISOString()
  }
];

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', message: 'Server is running' });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('Login requested');
  res.json({ 
    success: true, 
    user: mockUsers[0]
  });
});

app.get('/api/auth/user', (req, res) => {
  console.log('Current user requested');
  res.json(mockUsers[0]);
});

app.post('/api/auth/logout', (req, res) => {
  console.log('Logout requested');
  res.json({ success: true });
});

// User endpoints
app.get('/api/users', (req, res) => {
  console.log('Users requested');
  res.json(mockUsers);
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  console.log(`User ${id} requested`);
  const user = mockUsers.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Track endpoints
app.get('/api/tracks', (req, res) => {
  console.log('Tracks requested');
  res.json(mockTracks);
});

app.get('/api/tracks/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Track ${id} requested`);
  const track = mockTracks.find(t => t.id === id);
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }
  res.json(track);
});

app.post('/api/tracks', (req, res) => {
  console.log('Track creation requested');
  const newTrack = {
    id: `track-${Date.now()}`,
    ...req.body,
    userId: 'user-1', // Mock user ID
    plays: 0,
    likes: 0,
    createdAt: new Date().toISOString()
  };
  mockTracks.push(newTrack);
  res.status(201).json(newTrack);
});

// Battle endpoints
app.get('/api/battles', (req, res) => {
  console.log('Battles requested');
  res.json(mockBattles);
});

app.get('/api/battles/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Battle ${id} requested`);
  const battle = mockBattles.find(b => b.id === id);
  if (!battle) {
    return res.status(404).json({ error: 'Battle not found' });
  }
  res.json(battle);
});

app.post('/api/battles', (req, res) => {
  console.log('Battle creation requested');
  const newBattle = {
    id: `battle-${Date.now()}`,
    ...req.body,
    creatorId: 'user-1', // Mock user ID
    status: 'active',
    participants: [],
    createdAt: new Date().toISOString()
  };
  mockBattles.push(newBattle);
  res.status(201).json(newBattle);
});

// Beat endpoints
app.get('/api/beats', (req, res) => {
  console.log('Beats requested');
  res.json(mockBeats);
});

app.get('/api/beats/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Beat ${id} requested`);
  const beat = mockBeats.find(b => b.id === id);
  if (!beat) {
    return res.status(404).json({ error: 'Beat not found' });
  }
  res.json(beat);
});

app.post('/api/beats', (req, res) => {
  console.log('Beat creation requested');
  const newBeat = {
    id: `beat-${Date.now()}`,
    ...req.body,
    producerId: 'user-1', // Mock user ID
    licensed: false,
    createdAt: new Date().toISOString()
  };
  mockBeats.push(newBeat);
  res.status(201).json(newBeat);
});

// Collaboration endpoints
app.get('/api/collaborations', (req, res) => {
  console.log('Collaborations requested');
  res.json(mockCollaborations);
});

app.get('/api/collaborations/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Collaboration ${id} requested`);
  const collaboration = mockCollaborations.find(c => c.id === id);
  if (!collaboration) {
    return res.status(404).json({ error: 'Collaboration not found' });
  }
  res.json(collaboration);
});

app.post('/api/collaborations', (req, res) => {
  console.log('Collaboration creation requested');
  const newCollaboration = {
    id: `collab-${Date.now()}`,
    ...req.body,
    creatorId: 'user-1', // Mock user ID
    status: 'open',
    participants: [],
    createdAt: new Date().toISOString()
  };
  mockCollaborations.push(newCollaboration);
  res.status(201).json(newCollaboration);
});

console.log('Starting development server...');

app.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📱 Client running at http://localhost:5173`);
  console.log('✅ Database: Mock data (development)');
  console.log('🔧 Environment: Development');
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET /api/health - Health check');
  console.log('  POST /api/auth/login - Login user');
  console.log('  GET /api/auth/user - Get current user');
  console.log('  POST /api/auth/logout - Logout user');
  console.log('  GET /api/users - Get all users');
  console.log('  GET /api/tracks - Get all tracks');
  console.log('  POST /api/tracks - Create track');
  console.log('  GET /api/battles - Get all battles');
  console.log('  POST /api/battles - Create battle');
  console.log('  GET /api/beats - Get all beats');
  console.log('  POST /api/beats - Create beat');
  console.log('  GET /api/collaborations - Get all collaborations');
  console.log('  POST /api/collaborations - Create collaboration');
}).on('error', (err) => {
  console.error('Server error:', err);
});
