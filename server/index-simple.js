const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const JWT_SECRET = 'test_secret_key_2026';

// Mock users in memory
const users = {
  'owner@elitegrand.com': { id: 1, name: 'Owner', role: 'owner', password: 'Elitegrand#1818' },
  'reception@elitegrand.com': { id: 2, name: 'Reception', role: 'receptionist', password: 'Frontdesk#5100' }
};

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  // Check user
  const user = users[email];
  if (!user) {
    console.log('User not found:', email);
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Check password
  if (user.password !== password) {
    console.log('Wrong password for:', email);
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Create token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  console.log('Login successful:', email);
  
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email,
      role: user.role
    }
  });
});

// Dashboard endpoint (test)
app.get('/api/dashboard', (req, res) => {
  res.json({ todayCheckIns: 5, occupiedRooms: 12, revenue: 4500 });
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Backend running on port ${PORT}`);
  console.log(`\nTest credentials:`);
  console.log(`  owner@elitegrand.com / Elitegrand#1818`);
  console.log(`  reception@elitegrand.com / Frontdesk#5100\n`);
});
