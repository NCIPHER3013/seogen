import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkfyyidrrjenvwdxljze.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SECRET_KEY || ""';
const supabase = createClient(supabaseUrl, supabaseKey);

const imageDir = 'C:/Users/User/.gemini/antigravity-ide/brain/6cba0f64-43b4-4bd6-8acd-b37db148fbc7';

async function uploadImages() {
  const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
  const urlMap = {};

  for (const file of files) {
    const filePath = path.join(imageDir, file);
    const fileData = fs.readFileSync(filePath);
    const uploadName = `seo-campaign/${file}`;
    
    console.log(`Uploading ${file}...`);
    const { data, error } = await supabase.storage.from('articles').upload(uploadName, fileData, {
      contentType: 'image/png',
      upsert: true
    });

    if (error) {
      console.error(`Failed to upload ${file}:`, error);
    } else {
      const { data: publicUrlData } = supabase.storage.from('articles').getPublicUrl(uploadName);
      urlMap[file] = publicUrlData.publicUrl;
      console.log(`Success: ${publicUrlData.publicUrl}`);
    }
  }

  // Create an HTML file to inject these updates into the browser's localStorage
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Migrate Images to Supabase</title>
  <style>body { font-family: sans-serif; padding: 2rem; }</style>
</head>
<body>
  <h1>กำลังอัปเดตลิงก์รูปภาพทั้งหมดให้เป็นลิงก์สาธารณะ (Supabase) เพื่อให้ก๊อปปี้ลง Notion ได้...</h1>
  <div id="status">กำลังอัปเดต...</div>
  <script>
    const urlMap = ${JSON.stringify(urlMap)};
    // Mapping our friendly names to the actual filenames that were uploaded
    // e.g., gemini_img_cover_frozen -> frozen_sealer_cover_unbranded_1779976715523.png -> Supabase URL
    // To do this reliably, we match substrings.
    
    const resolveSupabaseUrl = (localName) => {
      // mapping logic based on what we generated
      const mappings = {
        'gemini_img_cover_frozen': 'frozen_sealer_cover_unbranded',
        'gemini_img_inline_frozen_1': 'frozen_sealer_inline1_unbranded',
        'gemini_img_inline_frozen_2': 'frozen_sealer_inline2_unbranded',
        'gemini_img_inline_frozen_3': 'frozen_sealer_inline3_unbranded',
        'gemini_img_cover_online': 'online_sealer_cover_unbranded',
        'gemini_img_inline_online_1': 'online_sealer_inline1_unbranded',
        'gemini_img_inline_online_2': 'online_sealer_inline2_footpedal', // updated
        'gemini_img_inline_online_3': 'online_sealer_inline3_miniband'   // updated
      };
      
      const searchKey = mappings[localName];
      if (!searchKey) return null;
      
      const matchedFile = Object.keys(urlMap).find(filename => filename.includes(searchKey));
      return matchedFile ? urlMap[matchedFile] : null;
    };

    try {
      const saved = localStorage.getItem('campaign_config_generatedArticles');
      if (saved) {
        let articles = JSON.parse(saved);
        
        articles = articles.map(article => {
          let updatedContent = article.content;
          
          article.images = article.images.map(img => {
            if (img.url.startsWith('gemini_img_')) {
              const publicUrl = resolveSupabaseUrl(img.url);
              if (publicUrl) {
                // Replace in content markdown
                updatedContent = updatedContent.replace(new RegExp(img.url, 'g'), publicUrl);
                return { ...img, url: publicUrl };
              }
            }
            return img;
          });
          
          return { ...article, content: updatedContent };
        });
        
        localStorage.setItem('campaign_config_generatedArticles', JSON.stringify(articles));
        document.getElementById('status').innerText = '✅ อัปเดตลิงก์รูปภาพสำเร็จ! ตอนนี้สามารถก๊อปปี้ลง Notion ได้แล้วครับ';
        document.getElementById('status').style.color = 'green';
      } else {
        document.getElementById('status').innerText = '❌ ไม่พบบทความในระบบ';
      }
    } catch (e) {
      document.getElementById('status').innerText = '❌ Error: ' + e.message;
    }
  </script>
</body>
</html>`;

  fs.writeFileSync('d:/SEOGEN/public/migrate-images.html', htmlContent);
  console.log('Generated migrate-images.html');
}

uploadImages();
