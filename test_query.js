const db = require('./server/config/db');

async function testSettlementAPI() {
  try {
    const dona_yy = '2024'; // 테스트용 연도
    const referral_name = '';

    console.log('--- Testing Settlement Summary Query ---');
    let query = `
      SELECT 
        r.referral_code,
        r.name as referral_name,
        SUM(d.dona_amt) as total_dona_amt,
        SUM(d.real_amt) as total_real_amt,
        SUM(d.refund_amt) as total_refund_amt,
        SUM(d.goods_amt) as total_goods_amt,
        SUM(d.deposit_amt) as total_deposit_amt,
        SUM(d.dona_amt - d.deposit_amt) as total_unpaid_amt,
        SUM(d.real_amt - d.refund_amt - d.goods_amt) as total_company_amt,
        SUM(d.real_amt * 0.1) as total_comm_amt
      FROM donation_detail d
      JOIN cust c ON d.cust_no = c.cust_no
      JOIN referral r ON c.referral_code = r.referral_code
      WHERE 1=1
    `;
    const params = [];
    // 연도 필터 없이 전체 조회 테스트
    query += ' GROUP BY r.referral_code, r.name ORDER BY r.name ASC';
    
    const [rows] = await db.execute(query, params);
    console.log('Success! Rows found:', rows.length);
    console.table(rows);

    process.exit(0);
  } catch (error) {
    console.error('SQL Error during settlement query:', error);
    process.exit(1);
  }
}

testSettlementAPI();
