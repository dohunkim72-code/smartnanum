const mysql = require('mysql2/promise');

async function checkSchema() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '!ch070809',
      database: 'smartnanum'
    });

    console.log('--- SHOW TABLES ---');
    const [tables] = await db.execute('SHOW TABLES');
    console.table(tables);

    // endDate 테이블이 있는지 확인
    const hasEndDateTable = tables.some(t => Object.values(t).includes('endDate'));
    
    if (hasEndDateTable) {
      console.log('\n--- DESC endDate ---');
      const [cols] = await db.execute('DESC endDate');
      console.table(cols);
    } else {
      console.log('\n--- endDate table NOT FOUND ---');
    }

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
