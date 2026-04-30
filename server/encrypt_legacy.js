const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });

async function updateLegacyPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const rawPassword = '!ch070809';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    
    // 김도훈 관리자(7528)의 비밀번호를 암호화된 값으로 업데이트
    const [result] = await connection.execute(
      'UPDATE referral SET pw = ? WHERE referral_code = ?',
      [hashedPassword, '7528']
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Success: Admin password has been encrypted.');
    } else {
      console.log('❌ Error: Admin account not found.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

updateLegacyPassword();
