import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const images = [
  'sme_cover_unbranded_1779995757569.png',
  'sme_inline1_unbranded_1779995783565.png',
  'sme_inline2_unbranded_1779995798869.png',
  'sme_inline3_unbranded_1779995813158.png'
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
  <title>Update SME Sealer Article (FINAL FIX)</title>
  <style>body { font-family: sans-serif; padding: 2rem; }</style>
</head>
<body>
  <h1>กำลังเปลี่ยนรูปภาพแบบ "ล้างไพ่" สำหรับบทความ: เครื่องซีล SME...</h1>
  <div id="status" style="white-space: pre-wrap; font-family: monospace; line-height: 1.5; margin-top: 20px;"></div>
  <script>
    const log = (msg) => {
      document.getElementById('status').innerHTML += msg + '<br>';
    };

    const newUrls = ${JSON.stringify(publicUrls)};
    
    try {
      const saved = localStorage.getItem('campaign_config_generatedArticles');
      if (saved) {
        let articles = JSON.parse(saved);
        
        // Find Article 5
        let targetArticle = articles.find(a => a.keyword === 'เครื่องซีล SME' || a.title.includes('เครื่องซีล SME'));
        
        if (targetArticle) {
          let updatedContent = targetArticle.content;
          
          // Regex to match markdown images: ![alt](url)
          const regex = /!\\[.*?\\]\\((.*?)\\)/g;
          let match;
          let imageLinksFound = [];
          
          while ((match = regex.exec(updatedContent)) !== null) {
            imageLinksFound.push(match[1]); // The URL part
          }
          
          log('พบรูปภาพในเนื้อหาทั้งหมด ' + imageLinksFound.length + ' รูป');
          
          if (imageLinksFound.length >= 4) {
            // Replace exactly the matched URLs in order
            log('แทนที่รูปที่ 1 (หน้าปก): ' + imageLinksFound[0] + ' -> รูปใหม่');
            updatedContent = updatedContent.split(imageLinksFound[0]).join(newUrls[0]);
            
            log('แทนที่รูปที่ 2 (Inline 1): ' + imageLinksFound[1] + ' -> รูปใหม่');
            updatedContent = updatedContent.split(imageLinksFound[1]).join(newUrls[1]);
            
            log('แทนที่รูปที่ 3 (Inline 2): ' + imageLinksFound[2] + ' -> รูปใหม่');
            updatedContent = updatedContent.split(imageLinksFound[2]).join(newUrls[2]);
            
            log('แทนที่รูปที่ 4 (Inline 3): ' + imageLinksFound[3] + ' -> รูปใหม่');
            updatedContent = updatedContent.split(imageLinksFound[3]).join(newUrls[3]);
            
            // Update images array
            targetArticle.images = [
               { url: newUrls[0], type: 'cover', alt: 'เครื่องซีลสายพานอุตสาหกรรม' },
               { url: newUrls[1], type: 'inline1', alt: 'เครื่องซีลสูญญากาศห้องคู่' },
               { url: newUrls[2], type: 'inline2', alt: 'เครื่องซีลเท้าเหยียบ' },
               { url: newUrls[3], type: 'inline3', alt: 'แผงควบคุมดิจิทัล' }
            ];
            
            targetArticle.content = updatedContent;
            localStorage.setItem('campaign_config_generatedArticles', JSON.stringify(articles));
            
            log('<br><span style="color:green; font-weight:bold; font-size: 1.2em;">✅ อัปเดตสำเร็จ! ลบภาพเก่าทิ้งแบบถอนรากถอนโคนแล้วครับ!</span><br>กลับไป Refresh ที่หน้าแอปได้เลยครับ');
          } else {
            log('<span style="color:red">❌ พบรูปน้อยกว่า 4 รูปในบทความ ไม่สามารถอัปเดตตามลำดับได้</span>');
          }
          
        } else {
          log('<span style="color:red">❌ ไม่พบบทความ เครื่องซีล SME ในระบบ</span>');
        }
      }
    } catch (e) {
      log('<span style="color:red">❌ Error: ' + e.message + '</span>');
    }
  </script>
</body>
</html>`;

  fs.writeFileSync('d:/SEOGEN/public/update-article5-final.html', htmlContent);
  console.log('Done!');
}

execute();
