const db = require('./config/db');

async function checkReferral() {
  try {
    const [rows] = await db.execute('SELECT id, name, referral_code, pw, grade FROM referral');
    console.log('--- Referral Table Rows ---');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}, Code: ${row.referral_code}, PW_Exists: ${!!row.pw}, Grade: ${row.grade}`);
    });
    console.log('---------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Error checking referral table:', error);
    process.exit(1);
  }
}

checkReferral();
