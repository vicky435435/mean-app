const mysql = require('mysql2/promise');

let pool;

/**
 * Creates a MySQL connection pool
 */
const connectMySQL = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'mean_interview_users',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected successfully');
    connection.release();
    return pool;
  } catch (error) {
    console.error(`❌ MySQL Connection Error: ${error.message}`);
    console.warn('⚠️  Continuing without MySQL — user features will be unavailable');
    // Don't exit; allow the app to run without MySQL for demo purposes
  }
};

/**
 * Runs initial DDL to create tables if they do not exist
 */
const initializeMySQL = async () => {
  if (!pool) return;

  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        username    VARCHAR(50)  NOT NULL UNIQUE,
        email       VARCHAR(100) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ MySQL tables initialized');
  } catch (error) {
    console.error(`❌ MySQL table initialization error: ${error.message}`);
  }
};

/**
 * Returns the active pool; throws if not yet connected
 */
const getPool = () => {
  if (!pool) throw new Error('MySQL pool not initialized');
  return pool;
};

module.exports = { connectMySQL, initializeMySQL, getPool };
