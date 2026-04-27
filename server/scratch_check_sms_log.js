const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('--- TB_SMS_LOG Structure ---');
    const [columns] = await connection.query('DESCRIBE TB_SMS_LOG');
    console.table(columns);

    console.log('\n--- Checking for existing data ---');
    const [rows] = await connection.query('SELECT * FROM TB_SMS_LOG ORDER BY reg_date DESC LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));

  } catch (error) {
    console.error('Error checking table:', error);
  } finally {
    await connection.end();
  }
}

checkTable();
