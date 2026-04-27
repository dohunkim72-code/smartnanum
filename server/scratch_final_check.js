const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartnanum'
  });

  try {
    console.log('--- donation_detail 컬럼 확인 ---');
    const [columns] = await connection.execute('SHOW COLUMNS FROM donation_detail');
    columns.forEach(col => {
      if (col.Field === 'signature' || col.Field.startsWith('agree')) {
        console.log(`${col.Field}: ${col.Type}`);
      }
    });

    console.log('\n--- donation_master 컬럼 확인 ---');
    const [mColumns] = await connection.execute('SHOW COLUMNS FROM donation_master');
    mColumns.forEach(col => {
      console.log(`${col.Field}: ${col.Type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkSchema();
