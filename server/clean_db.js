const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function cleanDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Cleaning Ticket_trail table...');
    await client.query('TRUNCATE TABLE "Ticket_trail" RESTART IDENTITY CASCADE;');
    console.log('Cleaning Tickets table...');
    await client.query('TRUNCATE TABLE "Tickets" RESTART IDENTITY CASCADE;');
    await client.query('COMMIT');
    console.log('✅ Database tickets cleaned successfully. Total tickets is now 0.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error cleaning database:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDb();
