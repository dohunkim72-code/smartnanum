const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });

async function checkReferral() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [rows] = await connection.execute('SELECT id, name, referral_code, pw FROM referral LIMIT 5');
    console.log('--- Referral Table Entries ---');
    console.table(rows);
    console.log('------------------------------');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkReferral();
