const { Pool } = require('pg');
require('dotenv').config();

// Try to connect to RDS, fall back to local if needed
let pool;
let isConnected = false;

try {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'motel_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    connectionTimeoutMillis: 5000
  });

  // Test connection
  pool.on('error', (err) => {
    console.error('⚠️  Database pool error:', err.message);
    isConnected = false;
  });
} catch (err) {
  console.error('⚠️  Failed to create pool:', err.message);
  pool = null;
}

// Initialize all tables
async function initializeDatabase() {
  if (!pool) {
    console.log('⚠️  Database not available - using in-memory storage');
    return;
  }

  try {
    console.log('🔄 Initializing database...');

    // Rooms table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        room_number VARCHAR(10) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        price_per_night DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bookings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        room_id INTEGER REFERENCES rooms(id),
        guests INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id),
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        payment_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        expense_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        user_id INTEGER,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database initialized successfully');
    isConnected = true;

    // Insert sample rooms if not existing
    const roomsCount = await pool.query('SELECT COUNT(*) FROM rooms');
    if (roomsCount.rows[0].count === '0') {
      await pool.query(`
        INSERT INTO rooms (room_number, status, price_per_night) VALUES
        ('101', 'available', 100),
        ('102', 'occupied', 100),
        ('103', 'available', 120),
        ('104', 'occupied', 120)
      `);
      console.log('✅ Sample rooms inserted');
    }

  } catch (err) {
    console.error('⚠️  Database initialization error:', err.message);
    console.log('⚠️  Falling back to in-memory storage...');
    isConnected = false;
  }
}

// In-memory storage fallback
const inMemoryDB = {
  rooms: [
    { id: 1, room_number: '101', status: 'available', price_per_night: 100 },
    { id: 2, room_number: '102', status: 'occupied', price_per_night: 100 },
    { id: 3, room_number: '103', status: 'available', price_per_night: 120 },
    { id: 4, room_number: '104', status: 'occupied', price_per_night: 120 }
  ],
  bookings: [],
  payments: [],
  expenses: [],
  auditLogs: []
};

module.exports = { pool, initializeDatabase, isConnected: () => isConnected, inMemoryDB };
