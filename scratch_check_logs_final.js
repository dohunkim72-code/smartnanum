const db = require('./server/config/db');

async function checkSmsLogs() {
  try {
    console.log('--- TB_SMS_LOG 최신 데이터 5건 조회 ---');
    const [rows] = await db.query('SELECT * FROM TB_SMS_LOG ORDER BY reg_date DESC LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));

    console.log('\n--- 전체 로그 건수 ---');
    const [countRows] = await db.query('SELECT COUNT(*) as cnt FROM TB_SMS_LOG');
    console.log(`총 건수: ${countRows[0].cnt}`);
    
  } catch (err) {
    console.error('조회 중 오류 발생:', err);
  } finally {
    process.exit(0);
  }
}

checkSmsLogs();
