const mysql = require('mysql2/promise'); // ✅ promise version

// Create pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'arthum',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL successfully!');
    conn.release();
  } catch (error) {
    console.error('Failed to connect to MySQL:', error);
  }
})();

module.exports = pool;
