// Native fetch used

async function test() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('1. Logging in as oasis...');
    const loginRes = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'oasis',
        pw: 'password123'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    
    const token = loginData.token;
    const cust_no = loginData.user.cust_no;
    console.log(`Login successful. Token obtained. cust_no: ${cust_no}`);

    console.log('2. Applying for donation...');
    const donationData = {
      id: 'oasis', // Used as reg_id/upd_id in controller
      cust_no: cust_no,
      name: '오아시스',
      residentIdFront: '800101',
      residentIdBack: '1234567',
      addressZip: '12345',
      addressBasic: '서울시 강남구',
      addressDetail: '테스트 아파트 101호',
      phone: '010-1234-5678',
      amount: '100,000',
      company: '테스트컴퍼니',
      cashReceipt: true
    };

    const applyRes = await fetch(`${baseURL}/api/donation/apply`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(donationData)
    });

    const applyData = await applyRes.json();
    console.log('Apply Donation Response:', applyData);

    console.log('3. Fetching donation history...');
    const historyRes = await fetch(`${baseURL}/api/donation/history?id=oasis`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const historyData = await historyRes.json();
    console.log('Donation History:', JSON.stringify(historyData, null, 2));

    console.log('\nSUCCESS: All tests passed!');
  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

test();
