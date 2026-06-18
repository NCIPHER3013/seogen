import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Reusing one GMP inline image due to quota limit for the 4th image
const images = [
  'forklift_clean_cover_unbranded_1780835648604.png',
  'forklift_clean_inline1_unbranded_1780835660040.png',
  'forklift_clean_inline2_unbranded_1780835671663.png',
  'forklift_gmp_inline1_unbranded_1780834162267.png'
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

  const articleContent = `# วิธีทำความสะอาดรถโฟล์คลิฟท์ในโรงงานอาหาร ตามมาตรฐาน GMP

ในสายการผลิตที่ทุกขั้นตอนต้องผ่านการตรวจสอบด้านสุขอนามัยอย่างเข้มงวด การรักษาความสะอาดของอุปกรณ์เคลื่อนย้ายวัสดุคือสิ่งที่ไม่สามารถมองข้ามได้ **วิธีทำความสะอาดรถโฟล์คลิฟท์** ไม่ใช่แค่การฉีดน้ำล้างคราบดินเหมือนรถยนต์ทั่วไป แต่เป็นกระบวนการทางวิทยาศาสตร์ที่ต้องใช้สารเคมีที่ถูกต้อง ขั้นตอนที่รัดกุม และความเข้าใจในวิศวกรรมของตัวรถ เพื่อป้องกันไม่ให้เกิดการปนเปื้อนข้าม (Cross-contamination) เข้าสู่อาหาร

การนำ **รถโฟล์คลิฟท์โรงงานอาหาร** เข้าสู่กระบวนการล้างทำความสะอาด (Sanitation Process) ตามมาตรฐาน GMP (Good Manufacturing Practice) มีขั้นตอนและข้อควรระวังอย่างไรบ้าง บทความนี้จะเจาะลึกถึงคู่มือปฏิบัติงานที่ถูกต้อง เพื่อยกระดับความปลอดภัยให้กับโรงงานของคุณขั้นสูงสุด

![เจ้าหน้าที่ในชุดป้องกันกำลังฉีดล้างทำความสะอาดรถโฟล์คลิฟท์ในโซนล้างอเนกประสงค์](${publicUrls[0]})

---

## สรุปประเด็นสำคัญ (Key Takeaways)
*   **Dry Cleaning ก่อนเสมอ:** ขั้นตอนแรกสุดต้องเป็นการกำจัดฝุ่นละอองและเศษขยะแบบแห้ง เพื่อไม่ให้เกิดการกระจายตัวของเชื้อโรคเมื่อโดนน้ำ
*   **น้ำยาทำความสะอาด Food Grade:** สารเคมี แชมพู และน้ำยาฆ่าเชื้อที่ใช้ ต้องได้รับการรับรองว่าปลอดภัยและไม่ทิ้งสารตกค้างที่เป็นพิษ
*   **ระวังจุดเสี่ยงไฟฟ้า:** รถโฟล์คลิฟท์ไฟฟ้ามีข้อควรระวังเรื่องระบบอิเล็กทรอนิกส์ การฉีดล้างต้องหลีกเลี่ยงแผงควบคุมและมอเตอร์โดยตรง
*   **การฆ่าเชื้อจุดสัมผัสร่วม (High-Touch Points):** พวงมาลัย คันโยก และเบาะนั่ง ต้องถูกเช็ดด้วยน้ำยาฆ่าเชื้อหลังจบทุกกะการทำงาน

---

## การเตรียมการและมาตรการด้านความปลอดภัย (Preparation & Safety)

ก่อนที่จะเริ่มกระบวนการทำความสะอาด พนักงานทำความสะอาดจะต้องสวมใส่อุปกรณ์ป้องกันส่วนบุคคล (PPE) ที่เหมาะสม เช่น ถุงมือยาง แว่นตากันกระเด็น และชุดกันน้ำ และที่สำคัญที่สุดคือ ต้องนำรถโฟล์คลิฟท์ไปยัง "พื้นที่ล้างที่จัดไว้เฉพาะ" (Designated Wash Bay) ซึ่งพื้นที่นี้ต้องมีระบบบำบัดน้ำเสียที่แยกออกจากพื้นที่สายการผลิตอาหารอย่างเด็ดขาด

### การตัดระบบไฟฟ้า (Lockout/Tagout)
เนื่องจากรถโฟล์คลิฟท์ในโรงงานอาหารมักเป็นรถโฟล์คลิฟท์ไฟฟ้า (Electric Forklift) กฎเหล็กข้อแรกก่อนให้น้ำแตะตัวรถคือ การปิดสวิตช์และถอดปลั๊กแบตเตอรี่ออกให้เรียบร้อย (Lockout) เพื่อป้องกันไฟฟ้าลัดวงจรและอันตรายต่อตัวพนักงานผู้ปฏิบัติหน้าที่ล้างรถ

---

## ขั้นตอนการทำความสะอาดระดับลึก (Deep Cleaning Process)

เมื่อเตรียมตัวรถพร้อมแล้ว กระบวนการทำความสะอาดตามมาตรฐาน GMP จะแบ่งออกเป็นขั้นตอนย่อยๆ ดังนี้ เพื่อให้มั่นใจว่าทุกซอกทุกมุมปราศจากเชื้อโรค

### 1. การทำความสะอาดห้องโดยสารและจุดสัมผัสร่วม (Cabin & High-Touch Areas)
เริ่มต้นจากพื้นที่ภายในห้องโดยสาร ซึ่งเป็นจุดที่เสี่ยงต่อการสะสมของแบคทีเรียจากเหงื่อและมือของผู้ขับขี่มากที่สุด 
*   ใช้ผ้าไมโครไฟเบอร์แบบใช้แล้วทิ้ง (Disposable Cloths) ฉีดพ่นด้วยน้ำยาฆ่าเชื้อ (Sanitizer) ที่ผ่านการรับรองสำหรับอุตสาหกรรมอาหาร (Food Safe) 
*   เช็ดทำความสะอาดพวงมาลัย คันโยกควบคุม ปุ่มกดต่างๆ และเบาะนั่งอย่างละเอียด 
*   **ข้อควรระวัง:** ห้ามฉีดน้ำหรือน้ำยาฆ่าเชื้อใส่หน้าปัดเรือนไมล์และอุปกรณ์อิเล็กทรอนิกส์โดยตรงเด็ดขาด ให้ฉีดลงบนผ้าก่อนแล้วจึงนำไปเช็ด

![การใช้ผ้าไมโครไฟเบอร์เช็ดทำความสะอาดพวงมาลัยและแผงควบคุมรถโฟล์คลิฟท์](${publicUrls[1]})

### 2. การทำความสะอาดงายกและกลไกไฮดรอลิก (Forks & Hydraulics)
"งายก" (Forks) คือส่วนที่อยู่ใกล้ชิดกับพาเลทและบรรจุภัณฑ์อาหารมากที่สุด จึงต้องสะอาดในระดับสูงสุด 
*   เริ่มจากการฉีดน้ำล้างคราบสกปรกเบื้องต้น (Pre-rinse) จากนั้นใช้สารขจัดไขมัน (Degreaser) แบบ Food Grade ฉีดพ่นทิ้งไว้ให้ทำปฏิกิริยากับคราบน้ำมันและสิ่งสกปรก
*   ใช้แปรงขนแข็งขัดบริเวณข้อต่อ โซ่ยก (Lifting Chain) และกระบอกไฮดรอลิก จากนั้นล้างออกด้วยน้ำร้อนแรงดันสูง 
*   หลังจากทำความสะอาดและเป่าแห้งเสร็จแล้ว ชิ้นส่วนเหล่านี้จะต้องได้รับการหล่อลื่นกลับคืนทันทีด้วยน้ำมันหรือจาระบีระดับ H1 (Food Grade Lubricants) เพื่อป้องกันสนิม

![ซูมใกล้บริเวณโซ่ยกและกระบอกไฮดรอลิกที่ได้รับการทำความสะอาดจนเงางามปราศจากคราบน้ำมัน](${publicUrls[2]})

### 3. การทำความสะอาดยางและล้อ (Tires & Wheels)
พื้นของโรงงานอาหารมีความสำคัญอย่างยิ่งต่อสุขอนามัยรวม การป้องกันไม่ให้ล้อรถโฟล์คลิฟท์นำพาสิ่งสกปรกจากภายนอกเข้ามาเป็นเรื่องที่ท้าทาย ล้อประเภท Non-Marking Tires ซึ่งมีสีขาวหรือเทานั้น มักจะสังเกตเห็นคราบสกปรกได้ง่าย 
*   ใช้น้ำยาทำความสะอาดแบบโฟม (Foaming Cleaner) ฉีดพ่นที่ล้อ เพื่อให้ฟองดึงเอาเศษฝุ่นและคราบดินที่ฝังลึกในร่องยางออกมา
*   ขัดด้วยแปรงและฉีดล้างออกให้เกลี้ยง การรักษาล้อให้สะอาดไม่เพียงแต่ดีต่อสุขอนามัย แต่ยังช่วยยืดอายุการใช้งานของพื้นอีพ็อกซี่ (Epoxy Floor) ในโรงงานด้วย

![สภาพล้อและยาง Non-marking สีขาวที่ได้รับการขัดล้างจนสะอาดหมดจดพร้อมใช้งานในพื้นที่ควบคุม](${publicUrls[3]})

---

## บทสรุป

การปฏิบัติและเรียนรู้ **วิธีทำความสะอาดรถโฟล์คลิฟท์** อย่างถูกต้องตามหลักการของ GMP ไม่ใช่เพียงแค่การรักษาสภาพเครื่องจักร แต่เป็นด่านหน้าสำคัญในการป้องกันเชื้อแบคทีเรีย สิ่งปนเปื้อน และอันตรายทางเคมีไม่ให้เล็ดลอดเข้าสู่กระบวนการผลิตอาหาร

สำหรับผู้บริหารและหัวหน้างาน การจัดทำตารางทำความสะอาดประจำวัน (Daily Checklist) และการล้างใหญ่ประจำสัปดาห์ (Weekly Deep Clean) สำหรับ **รถโฟล์คลิฟท์โรงงานอาหาร** คือมาตรฐานการทำงานที่สะท้อนถึงวิสัยทัศน์และความรับผิดชอบต่อผู้บริโภค การลงทุนในน้ำยาทำความสะอาดและอุปกรณ์ที่ถูกต้อง จะนำมาซึ่งผลลัพธ์ที่คุ้มค่าและปกป้องแบรนด์ของคุณจากความเสี่ยงด้านอาหารเป็นพิษได้อย่างยั่งยืน

---

## คำถามที่พบบ่อย (FAQs)

### Q: ใช้น้ำยาล้างรถทั่วไปมาล้างรถโฟล์คลิฟท์ในโรงงานอาหารได้หรือไม่?
**A:** ไม่แนะนำเด็ดขาดครับ น้ำยาล้างรถทั่วไปอาจมีส่วนผสมของสารเคมีที่มีกลิ่นรุนแรง หรือสารขัดเงาที่ทิ้งคราบตกค้าง (Residue) ซึ่งอาจระเหยหรือก่อให้เกิดการปนเปื้อนทางเคมี (Chemical Contamination) ในอากาศและตัวสินค้าได้ ต้องใช้น้ำยาที่ขึ้นทะเบียนเป็น Food Grade เท่านั้นครับ

### Q: สามารถใช้เครื่องฉีดน้ำแรงดันสูง (High-Pressure Washer) ล้างรถโฟล์คลิฟท์ไฟฟ้าได้ไหม?
**A:** สามารถใช้ล้างในส่วนโครงสร้างภายนอก งายก และล้อได้ครับ แต่ห้ามฉีดอัดแรงดันสูงเข้าใส่บริเวณห้องเครื่อง กล่องแบตเตอรี่ แผงควบคุมอิเล็กทรอนิกส์ หรือขั้วต่อสายไฟโดยตรงเด็ดขาด เพราะแรงดันน้ำอาจทะลวงผ่านซีลกันน้ำและทำให้อุปกรณ์ช็อตเสียหายได้

### Q: ใครควรเป็นคนล้างทำความสะอาดรถโฟล์คลิฟท์? พนักงานขับรถ หรือ แม่บ้าน?
**A:** โดยปกติ การเช็ดทำความสะอาดจุดสัมผัสร่วม (พวงมาลัย, เบาะนั่ง) หลังจบกะ ควรเป็นหน้าที่ของ "พนักงานขับรถ" ส่วนการล้างใหญ่ (Deep Clean) ด้วยน้ำยาเคมีในพื้นที่ Wash Bay ควรเป็นหน้าที่ของ "ทีมทำความสะอาดเฉพาะทาง (Sanitation Team)" หรือเจ้าหน้าที่ซ่อมบำรุงที่ได้รับการฝึกอบรมเรื่องความปลอดภัยทางไฟฟ้าและเคมีแล้วครับ`;

  const newArticle = {
    id: 'forklift-clean-article5-' + Date.now(),
    title: 'วิธีทำความสะอาดรถโฟล์คลิฟท์ในโรงงานอาหาร ตามมาตรฐาน GMP',
    keyword: 'วิธีทำความสะอาดรถโฟล์คลิฟท์',
    language: 'thai',
    content: articleContent,
    images: [
      { url: publicUrls[0], type: 'cover', alt: 'การฉีดล้างทำความสะอาดรถโฟล์คลิฟท์ในโซนซักล้าง' },
      { url: publicUrls[1], type: 'inline1', alt: 'การเช็ดฆ่าเชื้อจุดสัมผัสพวงมาลัยรถโฟล์คลิฟท์' },
      { url: publicUrls[2], type: 'inline2', alt: 'การทำความสะอาดกลไกโซ่ยกและไฮดรอลิก' },
      { url: publicUrls[3], type: 'inline3', alt: 'ล้อรถโฟล์คลิฟท์ Non-marking หลังการทำความสะอาด' }
    ],
    date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
  };

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Inject Article 5: Cleaning Forklift GMP</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #f4f4f5; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
    h1 { color: #18181b; font-size: 1.5rem; margin-bottom: 1rem; }
    #status { color: #2563eb; font-weight: bold; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>กำลังสร้างบทความที่ 5: วิธีทำความสะอาดรถโฟล์คลิฟท์...</h1>
    <div id="status">กำลังดำเนินการ...</div>
  </div>
  <script>
    const newArticle = ${JSON.stringify(newArticle)};
    
    try {
      const saved = localStorage.getItem('campaign_config_generatedArticles');
      let current = [];
      if (saved) {
        current = JSON.parse(saved);
      }
      
      const filtered = current.filter(a => a.keyword !== 'วิธีทำความสะอาดรถโฟล์คลิฟท์');
      filtered.unshift(newArticle);
      localStorage.setItem('campaign_config_generatedArticles', JSON.stringify(filtered));
      
      document.getElementById('status').innerText = '✅ บทความที่ 5 (การทำความสะอาด) ถูกสร้างและนำเข้าระบบเรียบร้อยแล้ว!';
      document.getElementById('status').style.color = '#16a34a';
    } catch (err) {
      document.getElementById('status').innerText = '❌ Error: ' + err.message;
      document.getElementById('status').style.color = '#dc2626';
    }
  </script>
</body>
</html>`;

  fs.writeFileSync('d:/SEOGEN/public/seed-article-forklift-5.html', htmlContent);
  console.log('Successfully wrote seed-article-forklift-5.html');
}

execute();
