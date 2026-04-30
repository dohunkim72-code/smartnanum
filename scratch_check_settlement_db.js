const db = require('./server/config/db');

async function checkData() {
  try {
    const [referrals] = await db.execute('SELECT * FROM referral');
    console.log('--- Referrals ---');
    console.log(referrals);

    const [donations] = await db.execute('SELECT * FROM donation_detail LIMIT 10');
    console.log('--- Donation Details (Top 10) ---');
    console.log(donations);

    const [counts] = await db.execute('SELECT dona_yy, COUNT(*) as count FROM donation_detail GROUP BY dona_yy');
    console.log('--- Donation Counts by Year ---');
    console.log(counts);

    const [joinTest] = await db.execute(`
      SELECT 
        d.dona_yy,
        r.referral_code,
        r.name as referral_name,
        COUNT(*) as count
      FROM donation_detail d
      JOIN cust c ON d.cust_no = c.cust_no
      JOIN referral r ON c.referral_code = r.referral_code
      GROUP BY d.dona_yy, r.referral_code, r.name
    `);
    console.log('--- Join Test Results ---');
    console.log(joinTest);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkData();
