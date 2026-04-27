const db = require('../server/config/db');

async function checkUser() {
  try {
    const [rows] = await db.query('SELECT cust_no, id, hpno FROM cust WHERE hpno = ?', ['01035617528']);
    console.log('USER_CHECK_RESULT:', JSON.stringify(rows));
    process.exit(0);
  } catch (error) {
    console.error('DB_ERROR:', error);
    process.exit(1);
  }
}

checkUser();
