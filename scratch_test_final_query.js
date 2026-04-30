const db = require('./server/config/db');

async function testQuery() {
  try {
    const dona_yy = '2026';
    const referral_code = '';
    const referral_name = '';

    let whereDonation = ' WHERE 1=1';
    const paramsDonation = [];
    if (dona_yy) {
      whereDonation += ' AND d.dona_yy = ?';
      paramsDonation.push(dona_yy);
    }
    if (referral_code) {
      whereDonation += ' AND r.referral_code = ?';
      paramsDonation.push(referral_code);
    }
    if (referral_name) {
      whereDonation += ' AND r.name LIKE ?';
      paramsDonation.push(`%${referral_name}%`);
    }

    const donationAggSql = `
      SELECT
        r.referral_code,
        r.name AS referral_name,
        SUM(d.dona_amt)  AS total_dona_amt,
        SUM(d.real_amt)  AS total_real_amt,
        SUM(d.refund_amt) AS total_refund_amt,
        SUM(d.goods_amt) AS total_goods_amt,
        SUM(d.deposit_amt) AS total_deposit_amt
      FROM donation_detail d
      JOIN cust c   ON d.cust_no = c.cust_no
      JOIN referral r ON c.referral_code = r.referral_code
      ${whereDonation}
      GROUP BY r.referral_code, r.name
    `;

    const preDepositAggSql = `
      SELECT
        c.referral_code,
        SUM(pd.deposit_amt) AS total_pre_deposit
      FROM pre_deposit pd
      JOIN donation_detail d ON d.cust_no = pd.cust_no AND d.dona_yy = pd.dona_yy
      JOIN cust c     ON c.cust_no = d.cust_no
      JOIN referral r ON r.referral_code = c.referral_code
      ${whereDonation}
      GROUP BY c.referral_code
    `;

    const finalSql = `
      SELECT
        da.referral_code,
        da.referral_name,
        da.total_dona_amt,
        da.total_real_amt,
        da.total_refund_amt,
        da.total_goods_amt,
        da.total_deposit_amt,
        (da.total_dona_amt - da.total_deposit_amt) as total_unpaid_amt,
        COALESCE(pa.total_pre_deposit, 0) AS total_pre_deposit,
        CASE
          WHEN da.referral_code = '6561'
            THEN ROUND((da.total_goods_amt / 60 * 53) * 0.666, 0)
          ELSE ROUND(da.total_goods_amt * 0.666, 0)
        END AS payment_amt,
        ROUND(da.total_real_amt * 0.1, 0) as total_comm_amt
      FROM (${donationAggSql}) da
      LEFT JOIN (${preDepositAggSql}) pa
        ON pa.referral_code = da.referral_code
      ORDER BY da.referral_name
    `;

    const values = [...paramsDonation, ...paramsDonation];
    const [rows] = await db.execute(finalSql, values);
    console.log('Result for 2026:');
    console.log(rows);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

testQuery();
