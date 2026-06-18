import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkfyyidrrjenvwdxljze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZnl5aWRycmplbnZ3ZHhsanplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjMxNjQsImV4cCI6MjA5MTk5OTE2NH0.8aEdtGp49KMGtbVrHZy4tW4rm-iNeyfiC11Br_PY8OI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Buckets:', data);
  }
}

listBuckets();
