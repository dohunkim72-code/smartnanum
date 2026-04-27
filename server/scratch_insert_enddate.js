const mysql = require('mysql2/promise');

async function insertDefault() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '!ch070809',
      database: 'smartnanum'
    });

    const currentYear = new Date().getFullYear().toString();
    await db.execute(
      'INSERT INTO enddate (yy, end_date, reg_id, upd_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE end_date = VALUES(end_date)', 
      [currentYear, `${currentYear}.12.31`, 'SYSTEM', 'SYSTEM']
    );

    console.log(`Default endDate for ${currentYear} inserted successfully.`);
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

insertDefault();
