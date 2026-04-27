const mysql = require('mysql2/promise');

async function checkCust() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '!ch070809',
      database: 'smartnanum'
    });

    console.log('--- DESC cust ---');
    const [cols] = await db.execute('DESC cust');
    console.table(cols);

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCust();
