const pg = require('pg');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const dbProjectId = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : '';
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const pool = new pg.Pool({
  connectionString: `postgresql://postgres:${dbPassword}@db.${dbProjectId}.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

async function syncUsers() {
  try {
    console.log('Fetching from auth.users...');
    const { rows: authUsers } = await pool.query('SELECT id, email FROM auth.users');
    console.log(`Found ${authUsers.length} users in auth.users`);
    
    for (const user of authUsers) {
      await pool.query(
        `INSERT INTO public.users (id, email, subscription_tier, word_credits, image_credits) 
         VALUES ($1, $2, 'free', 10000, 10) 
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.email]
      );
      console.log(`Synced user: ${user.email}`);
    }
    
    const { rows: publicUsers } = await pool.query('SELECT id, email FROM public.users');
    console.log(`\nNow public.users has ${publicUsers.length} users!`);
    
  } catch (err) {
    console.error('Error syncing:', err.message);
  } finally {
    pool.end();
  }
}

syncUsers();
