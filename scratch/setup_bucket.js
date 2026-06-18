import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkfyyidrrjenvwdxljze.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SECRET_KEY || ""'; // From .env SUPABASE_SECRET_KEY
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBucket() {
  console.log('Creating bucket "articles"...');
  const { data, error } = await supabase.storage.createBucket('articles', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    fileSizeLimit: 5242880
  });

  if (error) {
    console.error('Error creating bucket:', error);
  } else {
    console.log('Bucket created:', data);
  }
}

setupBucket();
