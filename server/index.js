const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const JWT_SECRET = 'motel_secret_2026';

// Database Connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'motel_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

console.log('📦 Database Config:');
console.log('  Host:', process.env.DB_HOST || 'localhost (DEFAULT)');
console.log('  Port:', process.env.DB_PORT || 5432);
console.log('  Database:', process.env.DB_NAME || 'motel_db (DEFAULT)');

// Initialize database tables
pool.query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    room_id INTEGER NOT NULL,
    guests INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.log('Note: Bookings table might already exist'));

// Users - hardcoded for simplicity
const users = {
  'owner@motel.com': {
    id: 1,
    name: 'Owner User',
    email: 'owner@motel.com',
    password: 'password123',
    role: 'owner'
  },
  'receptionist@motel.com': {
    id: 2,
    name: 'Receptionist User',
    email: 'receptionist@motel.com',
    password: 'password123',
    role: 'receptionist'
  }
};

// Mock data
const mockRooms = [
  { id: 1, room_number: '101', status: 'available', price_per_night: 100 },
  { id: 2, room_number: '102', status: 'occupied', price_per_night: 100 },
  { id: 3, room_number: '103', status: 'available', price_per_night: 120 },
  { id: 4, room_number: '104', status: 'occupied', price_per_night: 120 }
];

const mockBookings = [
  { id: 1, customer_name: 'John Doe', phone: '1234567890', check_in: '2026-03-25', check_out: '2026-03-27', room_id: 1, guests: 2, price: 300, status: 'pending' },
  { id: 2, customer_name: 'Jane Smith', phone: '0987654321', check_in: '2026-03-24', check_out: '2026-03-26', room_id: 2, guests: 1, price: 400, status: 'checked-in' }
];

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const user = users[email];

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// DASHBOARD
app.get('/api/dashboard', (req, res) => {
  res.json({
    todayCheckIns: 5,
    todayCheckOuts: 3,
    availableRooms: 8,
    occupiedRooms: 12,
    todayRevenue: 4500,
    todayExpenses: 450,
    todayProfit: 4050
  });
});

// ROOMS
app.get('/api/rooms', (req, res) => {
  res.json(mockRooms);
});

// BOOKINGS
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY check_in DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get bookings error:', err);
    // Fallback to mock data if DB fails
    res.json(mockBookings);
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { customer_name, phone, check_in, check_out, room_id, guests, price, status } = req.body;
    
    if (!customer_name || !phone || !check_in || !check_out || !room_id || !guests || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO bookings (customer_name, phone, check_in, check_out, room_id, guests, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [customer_name, phone, check_in, check_out, room_id, guests, price, status || 'pending']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Error creating booking' });
  }
});

// PAYMENTS
app.get('/api/payments', (req, res) => {
  res.json([]);
});

// EXPENSES
app.get('/api/expenses', (req, res) => {
  res.json([]);
});

// AUDIT
app.get('/api/audit', (req, res) => {
  res.json([]);
});

// HEALTH CHECK
app.get('/', (req, res) => {
  res.json({ message: 'Motel Management API Running', status: 'OK' });
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// START
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server started on port ${PORT}`);
  console.log(`Test: owner@motel.com / password123\n`);
});
