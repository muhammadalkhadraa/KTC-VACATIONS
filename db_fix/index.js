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

const sql = `
-- 1. Create Missing RPC Function
CREATE OR REPLACE FUNCTION increment_used_holidays(emp_id TEXT, days_count INT)
RETURNS VOID AS $$
BEGIN
  UPDATE employees
  SET used_holidays = used_holidays + days_count
  WHERE id = emp_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Try to Sync Role Table Name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') THEN
    BEGIN
      ALTER TABLE roles RENAME TO "Role";
    EXCEPTION
      WHEN duplicate_table THEN
        RAISE NOTICE 'Table Role already exists';
    END;
  END IF;
END $$;

-- 3. Ensure check_ins table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'Attendance') THEN
    BEGIN
      ALTER TABLE "Attendance" RENAME TO check_ins;
    EXCEPTION
      WHEN duplicate_table THEN
        RAISE NOTICE 'Table "check_ins" already exists';
    END;
  END IF;
END $$;

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    await client.query(sql);
    console.log('SQL executed successfully!');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
