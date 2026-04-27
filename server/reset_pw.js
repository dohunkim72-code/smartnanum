const path = require('path');
require('dotenv').config({ path: './.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '!ch070809',
    database: process.env.DB_NAME || 'smartnanum'
  });

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    
    console.log('New Hash:', hash);
    
    await conn.query('UPDATE cust SET pw = ? WHERE id = "oasis"', [hash]);
    console.log('Password reset successfully for oasis.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await conn.end();
  }
}

resetPassword();
