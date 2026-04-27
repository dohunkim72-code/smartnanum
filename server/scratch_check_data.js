const mysql = require('mysql2/promise');

async function checkData() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '!ch070809',
      database: 'smartnanum'
    });

    console.log('--- Current Year: ' + new Date().getFullYear() + ' ---');
    
    const [details] = await db.execute('SELECT * FROM donation_detail ORDER BY dona_yy DESC, seq_no DESC LIMIT 10');
    console.log('--- Last 10 records in donation_detail ---');
    console.table(details.map(d => ({ cust_no: d.cust_no, dona_yy: d.dona_yy, seq_no: d.seq_no, step: d.step_code, amt: d.dona_amt })));

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
