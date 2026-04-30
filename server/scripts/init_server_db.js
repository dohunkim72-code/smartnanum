const path = require('path');
const db = require('../config/db');

async function initServerDatabase() {
  console.log('🚀 서버 데이터베이스 초기화를 시작합니다...');

  const queries = [
    // 1. 추천인 마스터 테이블
    `CREATE TABLE IF NOT EXISTS referral (
      id int(11) NOT NULL AUTO_INCREMENT COMMENT '추천인일련번호',
      name varchar(50) NOT NULL COMMENT '추천인이름',
      referral_code varchar(20) NOT NULL COMMENT '추천인번호',
      pw varchar(256) NOT NULL COMMENT '비밀번호',
      hpno varchar(20) NOT NULL COMMENT '휴대폰번호',
      email_add varchar(50) NOT NULL COMMENT '이메일',
      grade varchar(2) NOT NULL COMMENT '등급',
      PRIMARY KEY (id),
      UNIQUE KEY referral_code (referral_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='추천인마스터'`,

    // 2. 상품 재고 마스터 테이블
    `CREATE TABLE IF NOT EXISTS product_stock_master (
      client_no varchar(10) NOT NULL,
      product_code varchar(10) NOT NULL,
      current_stock double DEFAULT NULL,
      last_receipt_date date DEFAULT NULL,
      last_release_date date DEFAULT NULL,
      PRIMARY KEY (client_no, product_code),
      KEY product_code (product_code),
      CONSTRAINT product_stock_master_ibfk_1 FOREIGN KEY (client_no) REFERENCES client_master (client_no),
      CONSTRAINT product_stock_master_ibfk_2 FOREIGN KEY (product_code) REFERENCES product_master (product_code),
      CONSTRAINT chk_stock_nonneg CHECK (current_stock >= 0)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 재고 마스터'`
  ];

  try {
    for (const query of queries) {
      await db.execute(query);
      console.log('✅ 테이블 생성/확인 완료');
    }
    
    // 초기 관리자 계정 생성 (선택 사항)
    const [rows] = await db.execute("SELECT * FROM referral WHERE referral_code = 'admin'");
    if (rows.length === 0) {
      await db.execute(
        "INSERT INTO referral (name, referral_code, pw, hpno, email_add, grade) VALUES (?, ?, ?, ?, ?, ?)",
        ['최고관리자', 'admin', 'admin1234', '010-0000-0000', 'admin@smartnanum.com', '01']
      );
      console.log('👤 초기 관리자 계정(admin/admin1234)이 서버에 생성되었습니다.');
    }

    console.log('✨ 서버 DB 초기화가 성공적으로 완료되었습니다!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 서버 DB 초기화 중 오류 발생:', error);
    process.exit(1);
  }
}

initServerDatabase();
