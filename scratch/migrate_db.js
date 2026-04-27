const mysql = require('mysql2/promise');
const path = require('path');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '', // 비밀번호가 있다면 여기에 입력
        database: 'smartnanum'
    });

    try {
        console.log('테이블 구조 변경 시작...');
        // dona_yy -> yy
        await connection.query('ALTER TABLE endDate CHANGE dona_yy yy varchar(4)');
        // endDate -> end_date
        await connection.query('ALTER TABLE endDate CHANGE endDate end_date varchar(10)');
        console.log('테이블 구조 변경 완료! (yy, end_date)');
    } catch (err) {
        console.error('변경 중 오류 발생:', err.message);
    } finally {
        await connection.end();
    }
}

migrate();
