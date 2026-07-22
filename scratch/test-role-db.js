import 'dotenv/config';
import pg from 'pg';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const dbProjectId = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : '';
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const encodedPassword = encodeURIComponent(dbPassword || '');
const pool = dbPassword && dbProjectId ? new pg.Pool({
  connectionString: `postgresql://postgres:${encodedPassword}@db.${dbProjectId}.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
}) : null;

async function test() {
  if (!pool) return console.log('no pool');
  const res = await pool.query('SELECT id, raw_user_meta_data FROM auth.users LIMIT 1');
  console.log(res.rows[0]);
  
  if (res.rows[0]) {
    const userId = res.rows[0].id;
    const updateRes = await pool.query(`
      UPDATE auth.users 
      SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', $1::text)
      WHERE id = $2
      RETURNING id, raw_user_meta_data;
    `, ['admin', userId]);
    console.log('Update result:', updateRes.rows[0]);
  }
  process.exit(0);
}
test();
