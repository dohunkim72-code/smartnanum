const db = require('./config/db');

async function fixSchema() {
  try {
    console.log('Adding missing columns to donation_detail...');
    
    const queries = [
      "ALTER TABLE donation_detail ADD COLUMN agree6 varchar(1) NOT NULL DEFAULT 'N' AFTER agree5",
      "ALTER TABLE donation_detail ADD COLUMN agree7 varchar(1) NOT NULL DEFAULT 'N' AFTER agree6",
      "ALTER TABLE donation_detail ADD COLUMN agree8 varchar(1) NOT NULL DEFAULT 'N' AFTER agree7",
      "ALTER TABLE donation_detail ADD COLUMN agree9 varchar(1) NOT NULL DEFAULT 'N' AFTER agree8",
      "ALTER TABLE donation_detail ADD COLUMN agree10 varchar(1) NOT NULL DEFAULT 'N' AFTER agree9",
      "ALTER TABLE donation_detail ADD COLUMN agree11 varchar(1) NOT NULL DEFAULT 'N' AFTER agree10",
      "ALTER TABLE donation_detail ADD COLUMN agree12 varchar(1) NOT NULL DEFAULT 'N' AFTER agree11",
      "ALTER TABLE donation_detail ADD COLUMN agree13 varchar(1) NOT NULL DEFAULT 'N' AFTER agree12",
      "ALTER TABLE donation_detail ADD COLUMN signature LONGTEXT DEFAULT NULL AFTER agree13"
    ];

    for (const query of queries) {
      try {
        await db.execute(query);
        console.log(`Success: ${query.substring(0, 50)}...`);
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          console.log(`Column already exists, skipping...`);
        } else {
          throw err;
        }
      }
    }
    
    console.log('Schema update completed! ✨');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    process.exit();
  }
}

fixSchema();
