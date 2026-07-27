
const fs = require('fs');

let content = fs.readFileSync('d:/seogentest/src/components/AppLayout.tsx', 'utf8');

const injection = 
  useEffect(() => {
    try {
      if (localStorage.getItem('typo_migration_v2_done')) return;
      
      const wrongWords = [
        [/สุญญากาศ/g, 'สูญญากาศ'],
        [/สูญากาศ/g, 'สูญญากาศ'],
        [/มือาชีพ/g, 'มืออาชีพ'],
        [/อาหาร้อน/g, 'อาหารร้อน'],
        [/กรไกร/g, 'กรรไกร'],
        [/จาการปนเปื้อน/g, 'จากการปนเปื้อน'],
        [/จาการซีล/g, 'จากการซีล'],
        [/ต้องการะดับ/g, 'ต้องการระดับ'],
        [/ข้อควระวัง/g, 'ข้อควรระวัง'],
        [/ช่วยับยั้ง/g, 'ช่วยยับยั้ง'],
        [/การู้วิธี/g, 'การรู้วิธี'],
        [/ช่วยืนยัน/g, 'ช่วยยืนยัน'],
        [/พบ่อย/g, 'พบบ่อย'],
        [/ช่วยืด/g, 'ช่วยยืด'],
        [/โครงสร้างเซล์/g, 'โครงสร้างเซลล์'],
        [/ก่อนำ/g, 'ก่อนนำ'],
        [/ใน้ำเดือด/g, 'ในน้ำเดือด'],
        [/สนิทั้ง/g, 'สนิททั้ง'],
        [/การั่วไหล/g, 'การรั่วไหล'],
        [/รอย่น/g, 'รอยย่น'],
        [/เนื้อาหาร/g, 'เนื้ออาหาร'],
        [/เห็ดิบ/g, 'เห็ดดิบ'],
        [/หรือาจ/g, 'หรืออาจ'],
        [/อย่าง่าย/g, 'อย่างง่าย'],
        [/รอยซีลเดิมาซีล/g, 'รอยซีลเดิมมาซีล'],
        [/หนึ่งมื้น/g, 'หนึ่งมื้อ'],
        [/ออกจากัน/g, 'ออกจากกัน'],
        [/กระดูก่อน/g, 'กระดูกก่อน'],
        [/ความชื้นี้/g, 'ความชื้นนี้'],
        [/ระบไร้อากาศ/g, 'ระบบไร้อากาศ'],
        [/การักษา/g, 'การรักษา'],
        [/หรือุ่น/g, 'หรืออุ่น'],
        [/แบ Sous-vide/g, 'แบบ Sous-vide'],
        [/ถูกักไว้/g, 'ถูกกักไว้'],
        [/หรืออกซิเจน/g, 'หรือออกซิเจน'],
        [/เนื่องจาก๊าซ/g, 'เนื่องจากก๊าซ'],
        [/สามารถูกดึง/g, 'สามารถถูกดึง'],
        [/แบเรียบ/g, 'แบบเรียบ'],
        [/ขั้นตอนี้/g, 'ขั้นตอนนี้'],
        [/ตรวจับ/g, 'ตรวจจับ']
      ];
      
      let changedGlobal = false;
      const keys = ['campaign_config_generatedArticles', 'generatedArticles'];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('campaign_config') || key.includes('generatedArticles'))) {
          const item = localStorage.getItem(key);
          if (item) {
            let str = item;
            let changed = false;
            for (const [pattern, replacement] of wrongWords) {
              const oldStr = str;
              str = str.replace(pattern, replacement);
              if (oldStr !== str) changed = true;
            }
            if (changed) {
              localStorage.setItem(key, str);
              changedGlobal = true;
            }
          }
        }
      }
      
      localStorage.setItem('typo_migration_v2_done', 'true');
      if (changedGlobal) {
        window.location.reload();
      }
    } catch (e) {}
  }, []);
;

const insertIndex = content.indexOf('  const handleSignOut');
if (insertIndex !== -1) {
    content = content.substring(0, insertIndex) + injection + '\n' + content.substring(insertIndex);
    fs.writeFileSync('d:/seogentest/src/components/AppLayout.tsx', content);
    console.log('AppLayout migration injected!');
} else {
    console.log('Insert location not found');
}

