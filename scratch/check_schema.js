const db = require('./server/config/db');

async function checkSchema() {
  try {
    const [custColumns] = await db.query('DESC cust');
    console.log('--- cust table ---');
    console.table(custColumns.map(c => ({ Field: c.Field, Type: c.Type })));

    const [masterColumns] = await db.query('DESC donation_master');
    console.log('\n--- donation_master table ---');
    console.table(masterColumns.map(c => ({ Field: c.Field, Type: c.Type })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
