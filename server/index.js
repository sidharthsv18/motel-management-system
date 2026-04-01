const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { db, query, queryOne, execute, initializeDatabase, isConnected } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const JWT_SECRET = 'motel_secret_2026';

// Initialize database on startup
initializeDatabase();

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

// ========== MIDDLEWARE ==========
// Authenticate token from Authorization header
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Check if user is owner
const requireOwner = (req, res, next) => {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Only owners can perform this action' });
  }
  next();
};

// ========== LOGIN ==========
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};

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
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login error: ' + err.message });
  }
});

// ========== DASHBOARD ==========
app.get('/api/dashboard', (req, res) => {
  try {
    if (isConnected()) {
      const todayBookings = queryOne(`SELECT COUNT(*) as count FROM bookings WHERE DATE(check_in) = DATE('now')`);
      const totalRooms = queryOne(`SELECT COUNT(*) as count FROM rooms`);
      const occupiedRooms = queryOne(`SELECT COUNT(*) as count FROM rooms WHERE status = 'occupied'`);
      const availableRooms = (totalRooms.count - occupiedRooms.count) || 0;
      const availableRoomNumbers = query(`SELECT room_number FROM rooms WHERE status = 'available' ORDER BY room_number ASC`);
      
      const todayRevenue = queryOne(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(payment_date) = DATE('now')`);
      const todayExpenses = queryOne(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE DATE(expense_date) = DATE('now')`);

      const revenue = todayRevenue.total || 0;
      const expenses = todayExpenses.total || 0;

      res.json({
        todayCheckIns: todayBookings.count,
        todayCheckOuts: 0,
        availableRooms: availableRooms,
        availableRoomNumbers: availableRoomNumbers.map(r => r.room_number),
        occupiedRooms: occupiedRooms.count,
        todayRevenue: revenue,
        todayExpenses: expenses,
        todayProfit: (revenue - expenses).toFixed(2)
      });
    } else {
      throw new Error('Database not available');
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    res.json({
      todayCheckIns: 0,
      todayCheckOuts: 0,
      availableRooms: 0,
      availableRoomNumbers: [],
      occupiedRooms: 0,
      todayRevenue: 0,
      todayExpenses: 0,
      todayProfit: 0,
      error: err.message
    });
  }
});

// ========== ROOMS ==========
app.get('/api/rooms', (req, res) => {
  try {
    const rooms = query('SELECT * FROM rooms ORDER BY room_number ASC');
    res.json(rooms);
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

app.post('/api/rooms', (req, res) => {
  try {
    const { room_number, status, price_per_night } = req.body;
    const result = execute(
      'INSERT INTO rooms (room_number, status, price_per_night) VALUES (?, ?, ?)',
      [room_number, status || 'available', price_per_night || null]
    );
    const room = queryOne('SELECT * FROM rooms WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(room);
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ message: 'Error creating room' });
  }
});

// ========== BOOKINGS ==========
app.get('/api/bookings', (req, res) => {
  try {
    const bookings = query(`
      SELECT b.*, r.room_number FROM bookings b 
      LEFT JOIN rooms r ON b.room_id = r.id 
      ORDER BY b.check_in DESC
    `);
    res.json(bookings);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

app.post('/api/bookings', (req, res) => {
  try {
    const { customer_name, phone, check_in, check_out, room_id, guests, price, status } = req.body;

    if (!customer_name || !phone || !check_in || !check_out || !room_id || !guests || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = execute(
      'INSERT INTO bookings (customer_name, phone, check_in, check_out, room_id, guests, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_name, phone, check_in, check_out, room_id, guests, price, status || 'pending']
    );

    // Log to audit with details about the booking
    execute(
      'INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes) VALUES (?, ?, ?, ?, ?)',
      ['CREATE', 'BOOKING', result.lastInsertRowid, 1, JSON.stringify({ customer_name, room_id, guests, price, status: 'pending' })]
    );

    const booking = queryOne('SELECT * FROM bookings WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(booking);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Error creating booking' });
  }
});

app.put('/api/bookings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    execute('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    const booking = queryOne('SELECT * FROM bookings WHERE id = ?', [id]);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ message: 'Error updating booking' });
  }
});

// ========== PAYMENTS ==========
app.get('/api/payments', (req, res) => {
  try {
    const payments = query(`
      SELECT p.*, b.customer_name, b.price, b.phone, b.check_in, b.check_out FROM payments p 
      LEFT JOIN bookings b ON p.booking_id = b.id 
      ORDER BY p.created_at DESC
    `);
    res.json(payments);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// New endpoint to get booking details by booking ID for payment form population
app.get('/api/bookings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const booking = queryOne(`
      SELECT b.*, r.room_number FROM bookings b 
      LEFT JOIN rooms r ON b.room_id = r.id 
      WHERE b.id = ?
    `, [id]);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ message: 'Error fetching booking' });
  }
});

app.post('/api/payments', (req, res) => {
  try {
    const { booking_id, customer_name, amount, payment_method, status } = req.body;

    if (!booking_id || !customer_name || !amount) {
      return res.status(400).json({ message: 'Missing required fields: booking_id, customer_name, and amount' });
    }

    // Verify booking exists
    const booking = queryOne('SELECT * FROM bookings WHERE id = ?', [booking_id]);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Create payment and log changes
    const result = execute(
      'INSERT INTO payments (booking_id, amount, payment_method, status, payment_date) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [booking_id, amount, payment_method || 'cash', status || 'completed']
    );

    // Update booking status to 'paid' and log the change
    const oldStatus = booking.status;
    execute('UPDATE bookings SET status = ? WHERE id = ?', ['paid', booking_id]);
    
    // Log both the payment and the booking status change to audit
    const paymentId = result.lastInsertRowid;
    execute(
      'INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes) VALUES (?, ?, ?, ?, ?)',
      ['CREATE', 'PAYMENT', paymentId, 1, JSON.stringify({ amount, payment_method, booking_id })]
    );
    
    // Log booking status update
    execute(
      'INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes) VALUES (?, ?, ?, ?, ?)',
      ['UPDATE', 'BOOKING', booking_id, 1, JSON.stringify({ status: oldStatus + ' → paid' })]
    );

    const payment = queryOne('SELECT * FROM payments WHERE id = ?', [paymentId]);
    res.status(201).json(payment);
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ message: 'Error creating payment' });
  }
});

// ========== EXPENSES ==========
app.get('/api/expenses', (req, res) => {
  try {
    const expenses = query('SELECT * FROM expenses ORDER BY expense_date DESC');
    res.json(expenses);
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const { category, description, amount, expense_date } = req.body;

    if (!category || !amount || !expense_date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = execute(
      'INSERT INTO expenses (category, description, amount, expense_date) VALUES (?, ?, ?, ?)',
      [category, description || '', amount, expense_date]
    );

    // Log to audit with details
    execute(
      'INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes) VALUES (?, ?, ?, ?, ?)',
      ['CREATE', 'EXPENSE', result.lastInsertRowid, 1, JSON.stringify({ category, description, amount, expense_date })]
    );

    const expense = queryOne('SELECT * FROM expenses WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(expense);
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ message: 'Error creating expense' });
  }
});

// ========== DELETE ENDPOINTS (Owner only) ==========
app.delete('/api/bookings/:id', authenticateToken, requireOwner, (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    console.log(`Delete request: booking ID=${bookingId}, user ID=${req.user.id}, role=${req.user.role}`);
    
    // Get booking details before deletion for audit log
    const booking = queryOne('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) {
      console.log(`Booking ${bookingId} not found`);
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Delete the booking
    execute('DELETE FROM bookings WHERE id = ?', [bookingId]);
    console.log(`Booking ${bookingId} deleted successfully`);

    // Log deletion to audit
    execute(
      'INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes) VALUES (?, ?, ?, ?, ?)',
      ['DELETE', 'BOOKING', bookingId, req.user.id, JSON.stringify(booking)]
    );

    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ message: 'Error deleting booking: ' + err.message });
  }
});

app.delete('/api/payments/:id', authenticateToken, requireOwner, (req, res) => {
  try {
    const paymentId = parseInt(req.params.id, 10);
    console.log(`Delete request: payment ID=${paymentId}, user ID=${req.user.id}, role=${req.user.role}`);
    
    // Get payment details before deletion for audit log
    const payment = queryOne('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!payment) {
      console.log(`Payment ${paymentId} not found`);
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Delete the payment
    execute('DELETE FROM payments WHERE id = ?', [paymentId]);
    console.log(`Payment ${paymentId} deleted successfully`);

    // Log deletion to audit
    execute(
      'INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes) VALUES (?, ?, ?, ?, ?)',
      ['DELETE', 'PAYMENT', paymentId, req.user.id, JSON.stringify(payment)]
    );

    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ message: 'Error deleting payment: ' + err.message });
  }
});

app.delete('/api/expenses/:id', authenticateToken, requireOwner, (req, res) => {
  try {
    const expenseId = parseInt(req.params.id, 10);
    console.log(`Delete request: expense ID=${expenseId}, user ID=${req.user.id}, role=${req.user.role}`);
    
    // Get expense details before deletion for audit log
    const expense = queryOne('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    if (!expense) {
      console.log(`Expense ${expenseId} not found`);
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Delete the expense
    execute('DELETE FROM expenses WHERE id = ?', [expenseId]);
    console.log(`Expense ${expenseId} deleted successfully`);

    // Log deletion to audit
    execute(
      'INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes) VALUES (?, ?, ?, ?, ?)',
      ['DELETE', 'EXPENSE', expenseId, req.user.id, JSON.stringify(expense)]
    );

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ message: 'Error deleting expense: ' + err.message });
  }
});

app.delete('/api/rooms/:id', authenticateToken, requireOwner, (req, res) => {
  try {
    const roomId = parseInt(req.params.id, 10);
    console.log(`Delete request: room ID=${roomId}, user ID=${req.user.id}, role=${req.user.role}`);
    
    // Get room details before deletion for audit log
    const room = queryOne('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!room) {
      console.log(`Room ${roomId} not found`);
      return res.status(404).json({ message: 'Room not found' });
    }

    // Delete the room
    execute('DELETE FROM rooms WHERE id = ?', [roomId]);
    console.log(`Room ${roomId} deleted successfully`);

    // Log deletion to audit
    execute(
      'INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes) VALUES (?, ?, ?, ?, ?)',
      ['DELETE', 'ROOM', roomId, req.user.id, JSON.stringify(room)]
    );

    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ message: 'Error deleting room: ' + err.message });
  }
});

// ========== AUDIT LOGS ==========
app.get('/api/audit', (req, res) => {
  try {
    const logs = query(`
      SELECT 
        id,
        action,
        entity_type,
        entity_id,
        user_id,
        changes,
        created_at,
        'system' as user_email
      FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT 100
    `);
    res.json(logs);
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

// ========== HEALTH CHECK ==========
app.get('/', (req, res) => {
  res.json({ 
    message: 'Motel Management API Running', 
    status: 'OK',
    database: isConnected() ? 'SQLite ✅' : '❌ Offline'
  });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// ========== START SERVER ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server started on port ${PORT}`);
  console.log(`📦 Database: ${isConnected() ? '✅ SQLite Connected' : '❌ Not Available'}`);
  console.log(`Test: owner@motel.com / password123\n`);
});
