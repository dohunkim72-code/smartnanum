const db = require('./server/config/db');

async function checkSchema() {
  try {
    const [tables] = await db.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('Tables:', tableNames);

    for (const tableName of tableNames) {
      const [columns] = await db.execute(`DESCRIBE ${tableName}`);
      console.log(`\nTable: ${tableName}`);
      console.table(columns);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
