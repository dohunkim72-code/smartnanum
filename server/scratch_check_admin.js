const db = require('./config/db');

async function checkAdmin() {
  try {
    console.log('--- Referral (Admin) Table ---');
    const [rows] = await db.execute('SELECT id, name, referral_code FROM referral');
    console.table(rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin();
