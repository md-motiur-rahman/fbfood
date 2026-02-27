const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
// require('dotenv').config({ path: '.env.local' }); // Use node --env-file=.env.local instead

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

function getConnectionConfig() {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (rawUrl) return rawUrl;
  
  return {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: Number(process.env.DATABASE_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  };
}

async function migrate() {
  console.log('Starting migration...');
  
  let connection;
  try {
    const config = getConnectionConfig();
    connection = await mysql.createConnection(config);
    
    // Create migrations table if not exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const [rows] = await connection.execute('SELECT name FROM _migrations');
    const executedMigrations = new Set(rows.map(r => r.name));

    // Get migration files
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      fs.mkdirSync(MIGRATIONS_DIR);
      console.log(`Created migrations directory at ${MIGRATIONS_DIR}`);
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    for (const file of files) {
      if (executedMigrations.has(file)) {
        console.log(`Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`Executing ${file}...`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute SQL (split by semicolon if multiple statements)
      // Note: simplistic splitting, might break on semicolons in strings
      const statements = sql.split(';').filter(s => s.trim());
      
      await connection.beginTransaction();
      try {
        for (const statement of statements) {
          if (statement.trim()) {
            await connection.execute(statement);
          }
        }
        await connection.execute('INSERT INTO _migrations (name) VALUES (?)', [file]);
        await connection.commit();
        console.log(`Successfully executed ${file}`);
      } catch (err) {
        await connection.rollback();
        console.error(`Error executing ${file}:`, err);
        throw err;
      }
    }

    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
