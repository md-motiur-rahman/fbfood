
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: process.env.DATABASE_PORT,
  });

  const [rows] = await connection.execute('SELECT id, productname, is_top_selling FROM products WHERE is_top_selling = 1 OR is_top_selling = true LIMIT 10');
  console.log('Top selling products:', rows);
  
  const [allRows] = await connection.execute('SELECT id, productname, is_top_selling FROM products LIMIT 5');
  console.log('Sample products:', allRows);

  await connection.end();
}

main().catch(console.error);
