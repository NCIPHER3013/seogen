import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const images = [
  'tabletop_vacuum_cover_unbranded_1779995175619.png',
  'tabletop_band_inline_unbranded_1779995194318.png',
  'tabletop_control_inline_unbranded_1779995209812.png'
];
const baseDir = 'C:/Users/User/.gemini/antigravity-ide/brain/6cba0f64-43b4-4bd6-8acd-b37db148fbc7';

async function execute() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jkfyyidrrjenvwdxljze.supabase.co';
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'process.env.SUPABASE_SECRET_KEY || ""';
  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
  
  const publicUrls = [];
  for (const imgName of images) {
    const fullPath = path.join(baseDir, imgName);
    const fileBuffer = fs.readFileSync(fullPath);
    
    console.log('Uploading ' + imgName + '...');
    const { data, error } = await supabase.storage
      .from('articles')
      .upload(`seo-campaign/${imgName}`, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });
      
    if (error) {
      console.error('Failed to upload', error);
      return;
    }
    
    const { data: publicData } = supabase.storage.from('articles').getPublicUrl(`seo-campaign/${imgName}`);
    publicUrls.push(publicData.publicUrl);
  }
  
  console.log('Uploaded URLs:', publicUrls);
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Update Tabletop Sealer Article</title>
  <style>body { font-family: sans-serif; padding: 2rem; }</style>
</head>
<body>
  <h1>กำลังอัปเดตรูปภาพสำหรับบทความ: เครื่องซีลตั้งโต๊ะ ขนาดเล็ก...</h1>
  <div id="status">กำลังอัปเดต...</div>
  <script>
    const newUrls = ${JSON.stringify(publicUrls)};
    
    try {
      const saved = localStorage.getItem('campaign_config_generatedArticles');
      if (saved) {
        let articles = JSON.parse(saved);
        
        let targetArticle = articles.find(a => a.keyword === 'เครื่องซีลตั้งโต๊ะเล็ก' || a.title.includes('เครื่องซีลตั้งโต๊ะ'));
        if (targetArticle) {
          let updatedContent = targetArticle.content;
          
          // Using regex to replace the keys we know exist in this article
          const keysToReplace = [
            'gemini_img_cover_tabletop_vacuum',
            'gemini_img_inline_band_sealer',
            'gemini_img_inline_control_panel'
          ];
          
          let updatedCount = 0;
          for (let i = 0; i < keysToReplace.length; i++) {
             const key = keysToReplace[i];
             const newUrl = newUrls[i];
             
             // In case the content still has the raw key
             updatedContent = updatedContent.replace(new RegExp(key, 'g'), newUrl);
             updatedCount++;
          }
          
          // Also check if they were already mapped to something else in previous scripts
          // We will forcefully replace any image URLs in the images array
          if (targetArticle.images && targetArticle.images.length >= 3) {
             updatedContent = updatedContent.replace(new RegExp(targetArticle.images[0].url, 'g'), newUrls[0]);
             targetArticle.images[0].url = newUrls[0];
             
             updatedContent = updatedContent.replace(new RegExp(targetArticle.images[1].url, 'g'), newUrls[1]);
             targetArticle.images[1].url = newUrls[1];
             
             updatedContent = updatedContent.replace(new RegExp(targetArticle.images[2].url, 'g'), newUrls[2]);
             targetArticle.images[2].url = newUrls[2];
          } else {
             targetArticle.images = [
               { url: newUrls[0], type: 'cover', alt: 'เครื่องซีลตั้งโต๊ะแบบสูญญากาศ' },
               { url: newUrls[1], type: 'inline1', alt: 'เครื่องซีลสายพานตั้งโต๊ะ' },
               { url: newUrls[2], type: 'inline2', alt: 'แผงควบคุมดิจิทัล' }
             ];
          }
          
          targetArticle.content = updatedContent;
          localStorage.setItem('campaign_config_generatedArticles', JSON.stringify(articles));
          
          document.getElementById('status').innerHTML = '✅ อัปเดตบทความ <b>เครื่องซีลตั้งโต๊ะ ขนาดเล็ก</b> สำเร็จ!<br>กลับไป Refresh ที่หน้าแอป SEOGEN ได้เลยครับ';
          document.getElementById('status').style.color = 'green';
        } else {
          document.getElementById('status').innerText = '❌ ไม่พบบทความ เครื่องซีลตั้งโต๊ะ ในระบบ';
        }
      }
    } catch (e) {
      document.getElementById('status').innerText = '❌ Error: ' + e.message;
    }
  </script>
</body>
</html>`;

  fs.writeFileSync('d:/SEOGEN/public/update-article2.html', htmlContent);
  console.log('Done!');
}

execute();
