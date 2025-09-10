// db.js
const mysql = require('mysql2/promise');
const { MongoClient, ServerApiVersion } = require('mongodb');

// --- MongoDB Setup ---
const uri = 'mongodb+srv://prakash:GfEwo3Q47LodsjwW@cluster0.wodgssn.mongodb.net/arthum?retryWrites=true&w=majority&appName=Cluster0';

const mongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect once and reuse client
async function connectMongo() {
  if (!mongoClient.topology?.isConnected()) {
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB successfully!');
  }
  return mongoClient.db('arthum'); // return DB instance
}

// --- MySQL Setup ---
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'arthum',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test Connections (optional)
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL successfully!');
    conn.release();

    await connectMongo(); // just test Mongo connection
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
})();

// --- Exports ---
module.exports = {
  pool,          // MySQL pool
  connectMongo,  // Mongo connection function
};
