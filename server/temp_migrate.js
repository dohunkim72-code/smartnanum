const db = require('./config/db');

async function migrate() {
    try {
        console.log('테이블 구조 변경 시작 (endDate -> yy, end_date)...');
        
        // 컬럼명 변경 쿼리
        await db.query('ALTER TABLE endDate CHANGE dona_yy yy varchar(4)');
        await db.query('ALTER TABLE endDate CHANGE endDate end_date varchar(10)');
        
        console.log('✅ 테이블 구조 변경 완료!');
        
        // 변경된 구조 확인
        const [rows] = await db.query('DESCRIBE endDate');
        console.log('현재 테이블 구조:', rows);
        
    } catch (err) {
        console.error('❌ 변경 중 오류 발생:', err.message);
    } finally {
        process.exit();
    }
}

migrate();
