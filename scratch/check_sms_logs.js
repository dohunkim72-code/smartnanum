const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function checkSmsLogs() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('--- TB_SMS_LOG 최신 데이터 5건 조회 ---');
    const [rows] = await connection.query('SELECT * FROM TB_SMS_LOG ORDER BY reg_date DESC LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));

    console.log('\n--- 전체 로그 건수 ---');
    const [countRows] = await connection.query('SELECT COUNT(*) as cnt FROM TB_SMS_LOG');
    console.log(`총 건수: ${countRows[0].cnt}`);
    
  } catch (err) {
    console.error('조회 중 오류 발생:', err);
  } finally {
    await connection.end();
  }
}

checkSmsLogs();
