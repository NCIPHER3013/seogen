import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jkfyyidrrjenvwdxljze.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'process.env.SUPABASE_SECRET_KEY || ""';
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function check() {
  const { data, error } = await supabase.storage.from('articles').list('seo-campaign', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) console.error(error);
  else {
    console.log("Files:", data.map(f => f.name).slice(0, 15));
  }
}
check();
