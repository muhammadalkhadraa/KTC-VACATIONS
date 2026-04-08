const { Client } = require('pg');
const client = new Client({
  host: 'aws-1-eu-west-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.qhnqgsdprnedynbradxx',
  password: '11223344556677889900mm',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query("UPDATE employees SET used_holidays = 26 WHERE id = 'EMP001'");
  console.log('Successfully updated EMP001 used_holidays to 26 (Balance: -6)');
  await client.end();
}
run();
