const pg = require('pg');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const dbProjectId = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : '';
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
console.log('Connecting to Project:', dbProjectId);
const pool = new pg.Pool({
  connectionString: `postgresql://postgres:${dbPassword}@db.${dbProjectId}.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});
pool.query('SELECT id, email FROM auth.users')
  .then(res => { 
      console.log('--- auth.users (Users in Auth system) ---');
      console.log(res.rows); 
      return pool.query('SELECT id, email FROM public.users'); 
   })
  .then(res => { 
      console.log('--- public.users (Users in public table) ---');
      console.log(res.rows); 
      pool.end(); 
   })
  .catch(err => { 
      console.error('DB Error:', err.message); 
      pool.end(); 
  });
