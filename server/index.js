const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { pool, initializeDatabase, isConnected, inMemoryDB } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const JWT_SECRET = 'motel_secret_2026';

// Initialize database on startup
initializeDatabase();

// Helper to check if we should use DB or in-memory
const useDB = () => pool && isConnected();

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

// ========== LOGIN ==========
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

// ========== DASHBOARD ==========
app.get('/api/dashboard', async (req, res) => {
  try {
    if (useDB()) {
      const [bookings, rooms, payments, expenses] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM bookings WHERE check_in::date = CURRENT_DATE'),
        pool.query('SELECT COUNT(*) FROM rooms WHERE status = $1', ['occupied']),
        pool.query('SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date::date = CURRENT_DATE'),
        pool.query('SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE expense_date = CURRENT_DATE')
      ]);

      const todayRevenue = parseFloat(payments.rows[0].coalesce) || 0;
      const todayExpenses = parseFloat(expenses.rows[0].coalesce) || 0;

      res.json({
        todayCheckIns: parseInt(bookings.rows[0].count),
        todayCheckOuts: 0,
        availableRooms: 8,
        occupiedRooms: parseInt(rooms.rows[0].count),
        todayRevenue: todayRevenue,
        todayExpenses: todayExpenses,
        todayProfit: (todayRevenue - todayExpenses).toFixed(2)
      });
    } else {
      // Fallback
      res.json({
        todayCheckIns: 5,
        todayCheckOuts: 3,
        availableRooms: 8,
        occupiedRooms: 2,
        todayRevenue: 4500,
        todayExpenses: 450,
        todayProfit: 4050,
        _note: 'Using in-memory data'
      });
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// ========== ROOMS ==========
app.get('/api/rooms', async (req, res) => {
  try {
    if (useDB()) {
      const result = await pool.query('SELECT * FROM rooms ORDER BY room_number ASC');
      res.json(result.rows);
    } else {
      res.json(inMemoryDB.rooms);
    }
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { room_number, status, price_per_night } = req.body;
    
    if (useDB()) {
      const result = await pool.query(
        'INSERT INTO rooms (room_number, status, price_per_night) VALUES ($1, $2, $3) RETURNING *',
        [room_number, status || 'available', price_per_night]
      );
      res.status(201).json(result.rows[0]);
    } else {
      // In-memory
      const newRoom = {
        id: Math.max(...inMemoryDB.rooms.map(r => r.id), 0) + 1,
        room_number,
        status: status || 'available',
        price_per_night,
        created_at: new Date().toISOString()
      };
      inMemoryDB.rooms.push(newRoom);
      res.status(201).json(newRoom);
    }
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ message: 'Error creating room' });
  }
});

// ========== BOOKINGS ==========
app.get('/api/bookings', async (req, res) => {
  try {
    if (useDB()) {
      const result = await pool.query(
        'SELECT b.*, r.room_number FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id ORDER BY b.check_in DESC'
      );
      res.json(result.rows);
    } else {
      res.json(inMemoryDB.bookings);
    }
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { customer_name, phone, check_in, check_out, room_id, guests, price, status } = req.body;

    if (!customer_name || !phone || !check_in || !check_out || !room_id || !guests || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (useDB()) {
      const result = await pool.query(
        'INSERT INTO bookings (customer_name, phone, check_in, check_out, room_id, guests, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [customer_name, phone, check_in, check_out, room_id, guests, price, status || 'pending']
      );

      // Log to audit
      await pool.query(
        'INSERT INTO audit_logs (action, entity_type, entity_id, user_id) VALUES ($1, $2, $3, $4)',
        ['CREATE', 'BOOKING', result.rows[0].id, 1]
      );

      res.status(201).json(result.rows[0]);
    } else {
      // In-memory
      const newBooking = {
        id: Math.max(...inMemoryDB.bookings.map(b => b.id), 0) + 1,
        customer_name,
        phone,
        check_in,
        check_out,
        room_id: parseInt(room_id),
        guests: parseInt(guests),
        price: parseFloat(price),
        status: status || 'pending',
        created_at: new Date().toISOString()
      };
      inMemoryDB.bookings.push(newBooking);
      res.status(201).json(newBooking);
    }
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Error creating booking' });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (useDB()) {
      const result = await pool.query(
        'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.json(result.rows[0]);
    } else {
      // In-memory
      const booking = inMemoryDB.bookings.find(b => b.id === parseInt(id));
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      booking.status = status;
      res.json(booking);
    }
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ message: 'Error updating booking' });
  }
});

// ========== PAYMENTS ==========
app.get('/api/payments', async (req, res) => {
  try {
    if (useDB()) {
      const result = await pool.query(
        'SELECT p.*, b.customer_name FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id ORDER BY p.created_at DESC'
      );
      res.json(result.rows);
    } else {
      res.json(inMemoryDB.payments);
    }
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const { booking_id, amount, payment_method, status } = req.body;

    if (useDB()) {
      const result = await pool.query(
        'INSERT INTO payments (booking_id, amount, payment_method, status, payment_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
        [booking_id, amount, payment_method || 'cash', status || 'completed']
      );

      // Log to audit
      await pool.query(
        'INSERT INTO audit_logs (action, entity_type, entity_id, user_id) VALUES ($1, $2, $3, $4)',
        ['CREATE', 'PAYMENT', result.rows[0].id, 1]
      );

      res.status(201).json(result.rows[0]);
    } else {
      // In-memory
      const newPayment = {
        id: Math.max(...inMemoryDB.payments.map(p => p.id), 0) + 1,
        booking_id,
        amount,
        payment_method: payment_method || 'cash',
        status: status || 'completed',
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      inMemoryDB.payments.push(newPayment);
      res.status(201).json(newPayment);
    }
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ message: 'Error creating payment' });
  }
});

// ========== EXPENSES ==========
app.get('/api/expenses', async (req, res) => {
  try {
    if (useDB()) {
      const result = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC');
      res.json(result.rows);
    } else {
      res.json(inMemoryDB.expenses);
    }
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { category, description, amount, expense_date } = req.body;

    if (!category || !amount || !expense_date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (useDB()) {
      const result = await pool.query(
        'INSERT INTO expenses (category, description, amount, expense_date) VALUES ($1, $2, $3, $4) RETURNING *',
        [category, description || '', amount, expense_date]
      );

      // Log to audit
      await pool.query(
        'INSERT INTO audit_logs (action, entity_type, entity_id, user_id) VALUES ($1, $2, $3, $4)',
        ['CREATE', 'EXPENSE', result.rows[0].id, 1]
      );

      res.status(201).json(result.rows[0]);
    } else {
      // In-memory
      const newExpense = {
        id: Math.max(...inMemoryDB.expenses.map(e => e.id), 0) + 1,
        category,
        description: description || '',
        amount,
        expense_date,
        created_at: new Date().toISOString()
      };
      inMemoryDB.expenses.push(newExpense);
      res.status(201).json(newExpense);
    }
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ message: 'Error creating expense' });
  }
});

// ========== AUDIT LOGS ==========
app.get('/api/audit', async (req, res) => {
  try {
    if (useDB()) {
      const result = await pool.query(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100'
      );
      res.json(result.rows);
    } else {
      res.json(inMemoryDB.auditLogs);
    }
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
    database: useDB() ? 'PostgreSQL' : 'In-Memory (Fallback)'
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
  console.log(`📦 Database: ${useDB() ? 'PostgreSQL Connected' : 'Using In-Memory Storage (Fallback)'}`);
  console.log(`Test: owner@motel.com / password123\n`);
});
