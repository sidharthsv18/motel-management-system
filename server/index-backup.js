const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_12345';

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

// ========== MOCK DATA ==========
const mockUsers = {
  'owner@elitegrand.com': { id: 1, name: 'Owner', role: 'owner', password: 'Elitegrand#1818' },
  'reception@elitegrand.com': { id: 2, name: 'Reception', role: 'receptionist', password: 'Frontdesk#5100' }
};

const mockRooms = [
  { id: 1, room_number: '101', status: 'available', price_per_night: 100 },
  { id: 2, room_number: '102', status: 'occupied', price_per_night: 100 },
  { id: 3, room_number: '103', status: 'available', price_per_night: 120 },
  { id: 4, room_number: '104', status: 'occupied', price_per_night: 120 },
];

let mockBookings = [
  { id: 1, customer_name: 'John Doe', phone: '1234567890', check_in: '2026-03-25', check_out: '2026-03-27', room_id: 1, guests: 2, price: 300, status: 'pending', room_number: '101' },
  { id: 2, customer_name: 'Jane Smith', phone: '0987654321', check_in: '2026-03-24', check_out: '2026-03-26', room_id: 2, guests: 1, price: 400, status: 'checked-in', room_number: '102' },
];

let mockExpenses = [
  { id: 1, date: '2026-03-25', expense_type: 'maintenance', amount: 150, paid_to: 'John Plumber', notes: 'Fixed sink' },
  { id: 2, date: '2026-03-24', expense_type: 'cleaning', amount: 200, paid_to: 'Cleaning Service', notes: 'Weekly cleaning' },
];

let mockPayments = [
  { id: 1, booking_id: 1, total_amount: 300, paid_amount: 300, payment_method: 'cash', payment_date: '2026-03-25' },
  { id: 2, booking_id: 2, total_amount: 400, paid_amount: 400, payment_method: 'card', payment_date: '2026-03-24' },
];

const mockAuditLogs = [
  { id: 1, user_id: 1, action: 'CREATE', table_name: 'bookings', record_id: 1, user_email: 'owner@elitegrand.com', created_at: new Date() },
  { id: 2, user_id: 2, action: 'UPDATE', table_name: 'bookings', record_id: 2, user_email: 'reception@elitegrand.com', created_at: new Date() },
];

// ========== AUTH MIDDLEWARE ==========
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ message: 'Invalid token' });
  }
};

const authorizeRole = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ========== AUTH ROUTES ==========
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  const user = mockUsers[email];
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email, role: user.role } });
});

// ========== DASHBOARD ROUTES ==========
app.get('/api/dashboard', authenticateToken, (req, res) => {
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

// ========== ROOMS ROUTES ==========
app.get('/api/rooms', authenticateToken, (req, res) => {
  res.json(mockRooms);
});

app.put('/api/rooms/:id', authenticateToken, (req, res) => {
  const room = mockRooms.find(r => r.id === parseInt(req.params.id));
  if (!room) return res.status(404).json({ message: 'Room not found' });
  Object.assign(room, req.body);
  res.json(room);
});

// ========== BOOKINGS ROUTES ==========
app.get('/api/bookings', authenticateToken, (req, res) => {
  res.json(mockBookings);
});

app.post('/api/bookings', authenticateToken, (req, res) => {
  const newBooking = { id: mockBookings.length + 1, ...req.body };
  mockBookings.push(newBooking);
  res.json(newBooking);
});

app.put('/api/bookings/:id', authenticateToken, (req, res) => {
  const booking = mockBookings.find(b => b.id === parseInt(req.params.id));
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  Object.assign(booking, req.body);
  res.json(booking);
});

app.delete('/api/bookings/:id', authenticateToken, (req, res) => {
  const idx = mockBookings.findIndex(b => b.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Booking not found' });
  mockBookings.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// ========== EXPENSES ROUTES ==========
app.get('/api/expenses', authenticateToken, (req, res) => {
  res.json(mockExpenses);
});

app.post('/api/expenses', authenticateToken, (req, res) => {
  const newExpense = { id: mockExpenses.length + 1, ...req.body };
  mockExpenses.push(newExpense);
  res.json(newExpense);
});

app.put('/api/expenses/:id', authenticateToken, (req, res) => {
  const expense = mockExpenses.find(e => e.id === parseInt(req.params.id));
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  Object.assign(expense, req.body);
  res.json(expense);
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
  const idx = mockExpenses.findIndex(e => e.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Expense not found' });
  mockExpenses.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// ========== PAYMENTS ROUTES ==========
app.get('/api/payments', authenticateToken, (req, res) => {
  res.json(mockPayments);
});

app.post('/api/payments', authenticateToken, (req, res) => {
  const newPayment = { id: mockPayments.length + 1, ...req.body };
  mockPayments.push(newPayment);
  res.json(newPayment);
});

// ========== AUDIT ROUTES ==========
app.get('/api/audit', authenticateToken, authorizeRole(['owner']), (req, res) => {
  res.json(mockAuditLogs);
});

// ========== HEALTH CHECK ==========
app.get('/', (req, res) => {
  res.json({ message: 'Motel Management API Running ✅' });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error: ' + err.message });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Test: owner@elitegrand.com / Elitegrand#1818`);
});