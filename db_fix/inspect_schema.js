const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-eu-west-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.qhnqgsdprnedynbradxx',
  password: '11223344556677889900mm',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'holiday_requests'
    `);
    console.log('Columns in holiday_requests:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error inspecting schema:', err);
  } finally {
    await client.end();
  }
}

run();
