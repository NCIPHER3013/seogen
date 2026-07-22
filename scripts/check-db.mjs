import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Inw543221op++@db.jkfyyidrrjenvwdxljze.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

const res = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
console.log('=== Tables ===');
for (const t of res.rows) {
  const c = await pool.query(`SELECT COUNT(*)::int as c FROM "${t.table_name}"`);
  console.log(`  ${t.table_name}: ${c.rows[0].c} rows`);
}

console.log('\n=== Users ===');
const users = await pool.query('SELECT email, subscription_tier, word_credits, image_credits, created_at FROM public.users ORDER BY created_at DESC');
for (const u of users.rows) console.log(`  ${u.email} | ${u.subscription_tier} | w=${u.word_credits} i=${u.image_credits} | ${u.created_at}`);

await pool.end();
