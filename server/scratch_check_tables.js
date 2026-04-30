const db = require('./config/db');

async function checkSmsLogTable() {
  try {
    const [rows] = await db.execute('DESCRIBE TB_SMS_LOG');
    console.log('--- TB_SMS_LOG Table Structure ---');
    console.table(rows);
    console.log('---------------------------------');
    
    const [custRows] = await db.execute('DESCRIBE cust');
    console.log('--- cust Table Structure ---');
    console.table(custRows);
    console.log('----------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking tables:', error);
    process.exit(1);
  }
}

checkSmsLogTable();
