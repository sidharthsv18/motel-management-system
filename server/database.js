const Database = require('better-sqlite3');
const path = require('path');

// Use SQLite for simplicity - no complex setup needed
const dbPath = path.join(__dirname, '..', 'motel.db');
let db;
let isConnected = false;

try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  isConnected = true;
  console.log('✅ SQLite Database Connected:', dbPath);
} catch (err) {
  console.error('⚠️  Failed to initialize SQLite:', err.message);
  db = null;
  isConnected = false;
}

// Helper to execute queries
function query(sql, params = []) {
  if (!db) throw new Error('Database not connected');
  const stmt = db.prepare(sql);
  return params.length > 0 ? stmt.all(...params) : stmt.all();
}

function queryOne(sql, params = []) {
  if (!db) throw new Error('Database not connected');
  const stmt = db.prepare(sql);
  return params.length > 0 ? stmt.get(...params) : stmt.get();
}

function execute(sql, params = []) {
  if (!db) throw new Error('Database not connected');
  const stmt = db.prepare(sql);
  return params.length > 0 ? stmt.run(...params) : stmt.run();
}

// Initialize all tables
function initializeDatabase() {
  if (!db) {
    console.log('⚠️  Database not available');
    return;
  }

  try {
    console.log('🔄 Initializing SQLite database...');

    // Rooms table
    db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'available',
        price_per_night REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bookings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        room_id INTEGER,
        guests INTEGER NOT NULL,
        price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(room_id) REFERENCES rooms(id)
      )
    `);

    // Payments table
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        amount REAL NOT NULL,
        payment_method TEXT,
        status TEXT DEFAULT 'pending',
        payment_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(booking_id) REFERENCES bookings(id)
      )
    `);

    // Expenses table
    db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        expense_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        user_id INTEGER,
        changes TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized');

    // Insert sample rooms if not existing
    const roomCount = queryOne('SELECT COUNT(*) as count FROM rooms');
    if (roomCount.count === 0) {
      // Delete any existing rooms first
      db.prepare('DELETE FROM rooms').run();
      
      const insertRoom = db.prepare('INSERT INTO rooms (room_number, status) VALUES (?, ?)');
      db.exec('BEGIN');
      
      // Add rooms 401-407 (7 rooms)
      for (let i = 401; i <= 407; i++) {
        insertRoom.run(i.toString(), 'available');
      }
      
      // Add rooms 501-509 (9 rooms)
      for (let i = 501; i <= 509; i++) {
        insertRoom.run(i.toString(), 'available');
      }
      
      db.exec('COMMIT');
      console.log('✅ Sample rooms inserted (16 total: 401-407, 501-509)');
    }

  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    isConnected = false;
  }
}

module.exports = { db, query, queryOne, execute, initializeDatabase, isConnected: () => isConnected };
