const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function addAdmin() {
  try {
    const referral_code = '7777';
    const name = '관리자';
    const password = '1234';
    const email = 'admin@smartnanum.com';
    
    // 이미 존재하는지 확인
    const [exists] = await db.execute('SELECT * FROM referral WHERE referral_code = ?', [referral_code]);
    
    if (exists.length > 0) {
      console.log('Admin 7777 already exists. Updating password...');
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.execute('UPDATE referral SET pw = ?, name = ? WHERE referral_code = ?', [hashedPassword, name, referral_code]);
    } else {
      console.log('Adding Admin 7777...');
      const hashedPassword = await bcrypt.hash(password, 10);
      // id는 AUTO_INCREMENT가 아닐 수 있으므로 임의의 값 부여 (PK이므로 1로 시작하거나 시퀀스 확인 필요)
      // grade는 '01' (관리자), hpno는 '01000000000'
      await db.execute(
        'INSERT INTO referral (id, name, referral_code, pw, hpno, email_add, grade) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [7777, name, referral_code, hashedPassword, '01000000000', email, '01']
      );
    }
    
    console.log('Admin 7777 setup complete. Password is: ' + password);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addAdmin();
