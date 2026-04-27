const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function cleanupMaster() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartnanum'
  });

  try {
    console.log('--- donation_master 불필요 컬럼 제거 시작 ---');
    
    // 컬럼 존재 여부 확인 후 제거
    const [columns] = await connection.execute('SHOW COLUMNS FROM donation_master');
    const colNames = columns.map(c => c.Field);

    if (colNames.includes('ccpi')) {
      await connection.execute('ALTER TABLE donation_master DROP COLUMN ccpi');
      console.log('ccpi 컬럼 제거 완료');
    }
    if (colNames.includes('cpi3p')) {
      await connection.execute('ALTER TABLE donation_master DROP COLUMN cpi3p');
      console.log('cpi3p 컬럼 제거 완료');
    }
    if (colNames.includes('cpi3p_date')) {
      await connection.execute('ALTER TABLE donation_master DROP COLUMN cpi3p_date');
      console.log('cpi3p_date 컬럼 제거 완료');
    }

    console.log('정리가 완료되었습니다! ✨');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await connection.end();
  }
}

cleanupMaster();
