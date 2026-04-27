const db = require('./config/db');

async function applyFix() {
  try {
    console.log('--- Starting TB_SMS_LOG Schema Update ---');

    // 1. send_category 길이 확장
    console.log('Modifying send_category column...');
    await db.execute('ALTER TABLE TB_SMS_LOG MODIFY COLUMN send_category VARCHAR(30)');
    console.log('✅ send_category updated to VARCHAR(30)');

    // 2. cust_no NULL 허용 확인 및 수정
    console.log('Modifying cust_no column to allow NULL...');
    await db.execute('ALTER TABLE TB_SMS_LOG MODIFY COLUMN cust_no VARCHAR(15) NULL');
    console.log('✅ cust_no updated to allow NULL');

    // 3. 결과 확인
    console.log('\n--- Updated TB_SMS_LOG Structure ---');
    const [columns] = await db.query('DESCRIBE TB_SMS_LOG');
    console.table(columns);

  } catch (error) {
    console.error('❌ Error during schema update:', error);
  } finally {
    process.exit();
  }
}

applyFix();
