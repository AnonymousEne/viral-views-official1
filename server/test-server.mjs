import express from 'express';

const app = express();
const PORT = 5001; // Use a different port

app.get('/', (req, res) => {
  res.json({ message: 'Basic server works' });
});

console.log('Starting basic test server...');

app.listen(PORT, () => {
  console.log(`✓ Basic server running at http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});
