import { Pool } from 'pg';

// นี่คือสคริปต์สำหรับรันสร้างฐานข้อมูลทันทีเมื่อได้ Connection String
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Please provide DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const schemaSql = `
  -- 1. Create custom ENUM Types for consistency
  DO $$ BEGIN
    CREATE TYPE article_status AS ENUM ('Draft', 'Generating', 'Completed', 'Published');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
    CREATE TYPE image_type AS ENUM ('cover', 'inline');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  -- 2. "users" table
  CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email VARCHAR(255) UNIQUE NOT NULL,
      subscription_tier VARCHAR(50) DEFAULT 'free',
      word_credits INTEGER DEFAULT 10000,
      image_credits INTEGER DEFAULT 10,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- 3. "articles" table
  CREATE TABLE IF NOT EXISTS articles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      title VARCHAR(255),
      content TEXT,
      status article_status DEFAULT 'Draft',
      seo_score INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- 4. "images" table
  CREATE TABLE IF NOT EXISTS images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
      image_url TEXT NOT NULL,
      prompt_used TEXT,
      type image_type DEFAULT 'inline',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  --- ROW LEVEL SECURITY (RLS) POLICIES
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE images ENABLE ROW LEVEL SECURITY;

  -- User Profile Policies
  DROP POLICY IF EXISTS "Users can view own profile" ON users;
  CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

  -- Admin Policies (เช็ค user_metadata.role จาก auth.users)
  DROP POLICY IF EXISTS "Admins can view all users" ON users;
  CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
  );

  DROP POLICY IF EXISTS "Admins can update all users" ON users;
  CREATE POLICY "Admins can update all users" ON users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
  );

  -- Articles
  DROP POLICY IF EXISTS "Admins can view all articles" ON articles;
  CREATE POLICY "Admins can view all articles" ON articles FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
    OR auth.uid() = user_id
  );
  DROP POLICY IF EXISTS "Users can view own articles" ON articles;
  CREATE POLICY "Users can view own articles" ON articles FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert own articles" ON articles;
  CREATE POLICY "Users can insert own articles" ON articles FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update own articles" ON articles;
  CREATE POLICY "Users can update own articles" ON articles FOR UPDATE USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete own articles" ON articles;
  CREATE POLICY "Users can delete own articles" ON articles FOR DELETE USING (auth.uid() = user_id);

  -- Images
  DROP POLICY IF EXISTS "Users can view images of own articles" ON images;
  CREATE POLICY "Users can view images of own articles" ON images FOR SELECT USING (
      EXISTS (SELECT 1 FROM articles WHERE articles.id = images.article_id AND articles.user_id = auth.uid())
  );

  DROP POLICY IF EXISTS "Users can insert images to own articles" ON images;
  CREATE POLICY "Users can insert images to own articles" ON images FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM articles WHERE articles.id = images.article_id AND articles.user_id = auth.uid())
  );

  DROP POLICY IF EXISTS "Users can delete images from own articles" ON images;
  CREATE POLICY "Users can delete images from own articles" ON images FOR DELETE USING (
      EXISTS (SELECT 1 FROM articles WHERE articles.id = images.article_id AND articles.user_id = auth.uid())
  );
`;

async function runMigration() {
  console.log("Connecting to database and running schema creation...");
  try {
    await pool.query(schemaSql);
    console.log("✅ Schema successfully created and RLS enabled!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await pool.end();
  }
}

runMigration();
