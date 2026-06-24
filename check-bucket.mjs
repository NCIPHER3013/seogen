import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }
  
  const imagesBucket = buckets.find(b => b.name === 'images');
  if (!imagesBucket) {
    console.log('Creating images bucket...');
    const { error: createError } = await supabase.storage.createBucket('images', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880
    });
    if (createError) {
      console.error('Error creating bucket:', createError);
    } else {
      console.log('Images bucket created successfully!');
    }
  } else {
    console.log('Images bucket already exists. Ensuring it is public...');
    await supabase.storage.updateBucket('images', { public: true });
    console.log('Bucket updated.');
  }
}

checkAndCreateBucket();
