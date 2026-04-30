const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function resetAdminPasswords() {
  try {
    const hashedPassword = await bcrypt.hash('1234', 10);
    // 7528과 7777 모두 비밀번호를 1234로 초기화
    await db.execute('UPDATE referral SET pw = ? WHERE referral_code IN (?, ?)', [hashedPassword, '7528', '7777']);
    console.log('Passwords for admin 7528 and 7777 have been reset to 1234');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAdminPasswords();
