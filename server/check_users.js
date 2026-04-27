const mysql = require('mysql2/promise');

async function checkUsers() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '!ch070809',
      database: 'smartnanum'
    });

    console.log('--- Customers ---');
    const [rows] = await db.execute('SELECT cust_no, id, name FROM cust');
    console.table(rows);

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
