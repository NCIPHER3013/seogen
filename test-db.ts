import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const dbProjectId = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : '';
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
// URL Encode password
const encodedPassword = encodeURIComponent(dbPassword || '');

console.log("ProjectId:", dbProjectId);
console.log("Password:", dbPassword);
console.log("Encoded Password:", encodedPassword);

const pool = new pg.Pool({
  connectionString: `postgresql://postgres:${encodedPassword}@db.${dbProjectId}.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const res = await pool.query(`
      WITH dates AS (
        SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS d
      )
      SELECT 
        to_char(d, 'DD/MM') as date,
        (SELECT count(*)::int FROM public.users WHERE created_at::date = d) as users,
        (SELECT count(*)::int FROM public.articles WHERE created_at::date = d) as articles
      FROM dates
      ORDER BY d ASC;
    `);
    console.log("Chart Data:", res.rows);
  } catch (err) {
    console.error("DB connection failed:", err);
  } finally {
    await pool.end();
  }
}
run();
