const db = require('./server/config/db');

async function test() {
  try {
    const [rows] = await db.execute('DESCRIBE donation_master');
    console.log('donation_master columns:', rows.map(r => r.Field).join(', '));
    
    const [rows2] = await db.execute('DESCRIBE donation_detail');
    console.log('donation_detail columns:', rows2.map(r => r.Field).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
