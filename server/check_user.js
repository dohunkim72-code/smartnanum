const path = require('path');
require('dotenv').config({ path: './.env' });
const mysql = require('mysql2/promise');

async function checkUser() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '!ch070809',
    database: process.env.DB_NAME || 'smartnanum'
  });

  try {
    const [rows] = await conn.query('SELECT cust_no, id, pw FROM cust WHERE id = "oasis"');
    console.log('User oasis data:', rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await conn.end();
  }
}

checkUser();
