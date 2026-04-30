const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('1234', 10);
    await db.execute('UPDATE referral SET pw = ? WHERE referral_code = ?', [hashedPassword, '7777']);
    console.log('Password for admin 7777 has been reset to 1234');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
