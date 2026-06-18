import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const newImage = 'forklift_clean_inline3_new_unbranded_1780853120574.png';
const baseDir = 'C:/Users/User/.gemini/antigravity-ide/brain/6cba0f64-43b4-4bd6-8acd-b37db148fbc7';

async function execute() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jkfyyidrrjenvwdxljze.supabase.co';
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'process.env.SUPABASE_SECRET_KEY || ""';
  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
  
  const fullPath = path.join(baseDir, newImage);
  const fileBuffer = fs.readFileSync(fullPath);
  
  console.log('Uploading ' + newImage + '...');
  const { data, error } = await supabase.storage
    .from('articles')
    .upload(`seo-campaign/${newImage}`, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });
    
  if (error) {
    console.error('Failed to upload', error);
    return;
  }
  
  const { data: publicData } = supabase.storage.from('articles').getPublicUrl(`seo-campaign/${newImage}`);
  const newPublicUrl = publicData.publicUrl;
  console.log('New Uploaded URL:', newPublicUrl);

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Update Article 5 Image</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #f4f4f5; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
    h1 { color: #18181b; font-size: 1.5rem; margin-bottom: 1rem; }
    #status { color: #2563eb; font-weight: bold; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>กำลังเปลี่ยนรูปภาพที่ 4 ของบทความที่ 5...</h1>
    <div id="status">กำลังดำเนินการ...</div>
  </div>
  <script>
    const newImageUrl = "${newPublicUrl}";
    
    try {
      const saved = localStorage.getItem('campaign_config_generatedArticles');
      if (saved) {
        let current = JSON.parse(saved);
        const articleIndex = current.findIndex(a => a.keyword === 'วิธีทำความสะอาดรถโฟล์คลิฟท์');
        if (articleIndex !== -1) {
          // แทนที่รูปภาพที่ 4 (index 3)
          current[articleIndex].images[3].url = newImageUrl;
          
          // แก้ไขเนื้อหา alt text เล็กน้อยเพื่อให้ตรงกับรูปใหม่
          current[articleIndex].images[3].alt = "การฉีดพ่นโฟมทำความสะอาดยางรถโฟล์คลิฟท์ชนิด Non-marking";
          
          localStorage.setItem('campaign_config_generatedArticles', JSON.stringify(current));
          document.getElementById('status').innerText = '✅ อัปเดตเปลี่ยนภาพโฟมล้างล้อใหม่เรียบร้อยแล้ว!';
          document.getElementById('status').style.color = '#16a34a';
        } else {
          document.getElementById('status').innerText = '❌ ไม่พบบทความที่ 5 ในระบบ';
          document.getElementById('status').style.color = '#dc2626';
        }
      } else {
        document.getElementById('status').innerText = '❌ ไม่มีข้อมูลบทความใน LocalStorage';
        document.getElementById('status').style.color = '#dc2626';
      }
    } catch (err) {
      document.getElementById('status').innerText = '❌ Error: ' + err.message;
      document.getElementById('status').style.color = '#dc2626';
    }
  </script>
</body>
</html>`;

  fs.writeFileSync('d:/SEOGEN/public/update-article5-image.html', htmlContent);
  console.log('Successfully wrote update-article5-image.html');
}

execute();
