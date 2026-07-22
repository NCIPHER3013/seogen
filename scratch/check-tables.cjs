const pg = require('pg');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const dbProjectId = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : '';
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const pool = new pg.Pool({
  connectionString: `postgresql://postgres:${dbPassword}@db.${dbProjectId}.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

async function checkTables() {
  try {
    const { rows: tables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('--- Public Tables Overview ---');
    for (const { table_name } of tables) {
      const { rows } = await pool.query(`SELECT COUNT(*) as count FROM public.${table_name}`);
      console.log(`Table: ${table_name.padEnd(20)} | Rows: ${rows[0].count}`);
    }
    console.log('------------------------------');

  } catch (err) {
    console.error('Error checking tables:', err.message);
  } finally {
    pool.end();
  }
}

checkTables();
