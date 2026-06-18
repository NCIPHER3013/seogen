import fs from 'fs';

const baseDir = 'C:/Users/User/.gemini/antigravity-ide/brain/6cba0f64-43b4-4bd6-8acd-b37db148fbc7/';
const imageFiles = [
  'hand_sealer_cover_art_1779895264632.png',
  'new_impulse_sealer_cover_1779896079989.png',
  'table_sealer_cover_1779896868139.png',
  'compact_tabletop_sealer_1779896966237.png',
  'sealing_action_photo_1779895289913.png',
  'small_desk_sealer_action_1779896892074.png',
  'new_sealing_close_up_1779896100831.png'
];

const machineImagesBase64 = imageFiles.map(file => {
  const path = baseDir + file;
  const b64 = fs.readFileSync(path).toString('base64');
  return `data:image/png;base64,${b64}`;
});

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Fix Machine Images</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js"></script>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #f4f4f5; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
    h1 { color: #18181b; font-size: 1.5rem; margin-bottom: 1rem; }
    #status { color: #2563eb; font-weight: bold; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>กำลังทำการแก้ไขรูปภาพให้เป็น "เครื่องซีล" ทั้งหมด...</h1>
    <div id="status">Reading articles...</div>
  </div>
  <script>
    const machineImages = ${JSON.stringify(machineImagesBase64)};
    
    document.getElementById('status').innerText = 'Analyzing articles and injecting new images...';
    
    const saved = localStorage.getItem('campaign_config_generatedArticles');
    if (saved) {
      try {
        const articles = JSON.parse(saved);
        let imageIndex = 0;
        const promises = [];
        const replacedKeys = new Set();
        
        articles.forEach(article => {
          // match markdown images: ![alt](key)
          const regex = /!\\[.*?\\]\\((.*?)\\)/g;
          let match;
          while ((match = regex.exec(article.content)) !== null) {
            const imgKey = match[1];
            if (!replacedKeys.has(imgKey)) {
              replacedKeys.add(imgKey);
              const base64Data = machineImages[imageIndex % machineImages.length];
              promises.push(localforage.setItem(imgKey, base64Data));
              imageIndex++;
            }
          }
        });
        
        Promise.all(promises).then(() => {
          document.getElementById('status').innerText = '✅ แก้ไขรูปภาพสำเร็จ! รีเฟรชหน้าเว็บแอป SEOGEN เพื่อดูรูปเครื่องซีลใหม่ที่ไม่ซ้ำกันได้เลยครับ';
          document.getElementById('status').style.color = '#16a34a';
        }).catch(err => {
          document.getElementById('status').innerText = '❌ Error: ' + err.message;
          document.getElementById('status').style.color = '#dc2626';
        });
        
      } catch (e) {
        document.getElementById('status').innerText = '❌ JSON Parse Error: ' + e.message;
      }
    } else {
      document.getElementById('status').innerText = '❌ No articles found in localStorage.';
    }
  </script>
</body>
</html>`;

fs.writeFileSync('d:/SEOGEN/fix-images.html', htmlContent);
console.log('Successfully wrote fix-images.html');
