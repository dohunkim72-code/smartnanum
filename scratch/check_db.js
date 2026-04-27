require('dotenv').config({ path: './server/.env' });
const db = require('../server/config/db');

async function checkData() {
  try {
    const [rows] = await db.execute("SELECT * FROM client_master WHERE client_no = 'C0001'");
    console.log('--- CLIENT_CHECK_RESULT ---');
    console.log(JSON.stringify(rows, null, 2));
    
    const [detailRows] = await db.execute("SELECT * FROM donation_detail ORDER BY reg_date DESC LIMIT 5");
    console.log('\n--- LATEST_DETAILS ---');
    console.log(JSON.stringify(detailRows, null, 2));

    const [masterRows] = await db.execute("SELECT * FROM donation_master ORDER BY reg_date DESC LIMIT 5");
    console.log('\n--- LATEST_MASTERS ---');
    console.log(JSON.stringify(masterRows, null, 2));

    const [endDate] = await db.execute("SELECT * FROM endDate");
    console.log('\n--- END_DATE_TABLE ---');
    console.log(JSON.stringify(endDate, null, 2));

  } catch (err) {
    console.error('DB_ERROR:', err);
  } finally {
    process.exit();
  }
}

checkData();
