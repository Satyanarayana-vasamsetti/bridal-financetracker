const { Pool } = require('pg');
require('dotenv').config();

// 1. Collect database URL from all possible naming conventions
let rawUrl = 
  process.env.DATABASE_URL || 
  process.env.DATASOURCE_URL || 
  process.env.SPRING_DATASOURCE_URL || 
  process.env.POSTGRES_URL || 
  process.env.NEON_DATABASE_URL || 
  '';

let user = 
  process.env.DATASOURCE_USER || 
  process.env.SPRING_DATASOURCE_USERNAME || 
  process.env.DATABASE_USER || 
  process.env.PGUSER || 
  '';

let password = 
  process.env.DATASOURCE_PASSWORD || 
  process.env.SPRING_DATASOURCE_PASSWORD || 
  process.env.DATABASE_PASSWORD || 
  process.env.PGPASSWORD || 
  '';

// 2. Clean up JDBC prefix and extra quotes/parameters if present
let connectionString = rawUrl
  .replace(/^["']|["']$/g, '')
  .replace(/^jdbc:/, '')
  .replace(/([?&])channel_binding=[^&]*(&|$)/, '$1')
  .replace(/[?&]$/, '')
  .trim();

// 3. If URL has no user/pass embedded, but separate user/password variables exist, inject them
if (connectionString && user && password && !connectionString.includes('@')) {
  connectionString = connectionString.replace(
    /^(postgresql:\/\/|postgres:\/\/)/, 
    `$1${encodeURIComponent(user)}:${encodeURIComponent(password)}@`
  );
}

// 4. Log detected config (without exposing sensitive password)
const hasRemoteDb = connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

console.log('🔍 Database Configuration Check:');
console.log(`- Remote Connection String Found: ${hasRemoteDb ? 'YES' : 'NO'}`);
if (connectionString) {
  try {
    const urlObj = new URL(connectionString.replace('postgresql:', 'http:').replace('postgres:', 'http:'));
    console.log(`- Target DB Host: ${urlObj.hostname}`);
    console.log(`- Target DB Name: ${urlObj.pathname.replace('/', '')}`);
  } catch (e) {
    console.log(`- Raw DB URL preview: ${connectionString.substring(0, 25)}...`);
  }
}

// 5. Fallback for local development only if no URL provided
if (!connectionString) {
  const fallbackUser = user || 'postgres';
  const fallbackPass = password || 'postgres';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const database = process.env.DB_NAME || 'bridal_db';
  connectionString = `postgresql://${fallbackUser}:${fallbackPass}@${host}:${port}/${database}`;
  console.log('⚠️ No cloud database URL found. Falling back to localhost PostgreSQL.');
}

const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

// Safely ensure tables exist without modifying or dropping any existing data
async function initDb() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully.');

    // 100% Data Safe: CREATE TABLE IF NOT EXISTS never alters or deletes existing records
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bridal_event (
        id BIGSERIAL PRIMARY KEY,
        date VARCHAR(255),
        event_name VARCHAR(255),
        client_name VARCHAR(255),
        service_type VARCHAR(255),
        amount DOUBLE PRECISION,
        notes TEXT,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS expense (
        id BIGSERIAL PRIMARY KEY,
        date VARCHAR(255),
        expense_name VARCHAR(255),
        description VARCHAR(255),
        service_type VARCHAR(255),
        amount DOUBLE PRECISION,
        notes TEXT,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Database tables verified (users, bridal_event, expense).');
  } catch (err) {
    console.error('⚠️ Database connection warning:', err.message);
    if (isLocalhost) {
      console.error('👉 TIP: In Render Dashboard, please add the Environment Variable:');
      console.error('   Key: DATABASE_URL');
      console.error('   Value: (Your Neon.tech PostgreSQL connection string)');
    }
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDb,
};
