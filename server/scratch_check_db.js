const mysql = require('mysql2/promise');

async function checkSchema() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '!ch070809',
      database: 'smartnanum'
    });

    console.log('--- DESC donation_master ---');
    const [masterCols] = await db.execute('DESC donation_master');
    console.table(masterCols);

    console.log('\n--- DESC donation_detail ---');
    const [detailCols] = await db.execute('DESC donation_detail');
    console.table(detailCols);

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
