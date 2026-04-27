const db = require('./config/db');

async function checkSchema() {
  try {
    const [columns] = await db.execute('SHOW COLUMNS FROM donation_detail');
    console.log('--- donation_detail columns ---');
    columns.forEach(col => console.log(col.Field));
    
    const hasSignature = columns.some(col => col.Field === 'signature');
    const hasAgree1 = columns.some(col => col.Field === 'agree1');
    
    console.log('RESULT_SIGNATURE=' + hasSignature);
    console.log('RESULT_AGREE=' + hasAgree1);
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    process.exit();
  }
}

checkSchema();
