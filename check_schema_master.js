const db = require('./server/config/db');

async function checkSchema() {
  try {
    console.log('--- donation_master table schema ---');
    const [masterCols] = await db.execute('DESCRIBE donation_master');
    console.table(masterCols);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
