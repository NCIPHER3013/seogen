
const fs = require('fs');
let content = fs.readFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', 'utf8');

const typos = {
  'สุญญากาศ': 'สูญญากาศ',
  'สูญากาศ': 'สูญญากาศ',
  'มือาชีพ': 'มืออาชีพ',
  'อาหาร้อน': 'อาหารร้อน',
  'กรไกร': 'กรรไกร',
  'จาการปนเปื้อน': 'จากการปนเปื้อน',
  'จาการซีล': 'จากการซีล',
  'ต้องการะดับ': 'ต้องการระดับ',
  'ข้อควระวัง': 'ข้อควรระวัง',
  'ช่วยับยั้ง': 'ช่วยยับยั้ง',
  'การู้วิธี': 'การรู้วิธี',
  'ช่วยืนยัน': 'ช่วยยืนยัน',
  'พบ่อย': 'พบบ่อย',
  'ช่วยืด': 'ช่วยยืด',
  'โครงสร้างเซล์': 'โครงสร้างเซลล์',
  'ก่อนำ': 'ก่อนนำ',
  'ใน้ำเดือด': 'ในน้ำเดือด',
  'สนิทั้ง': 'สนิททั้ง',
  'การั่วไหล': 'การรั่วไหล',
  'รอย่น': 'รอยย่น',
  'เนื้อาหาร': 'เนื้ออาหาร',
  'เห็ดิบ': 'เห็ดดิบ',
  'หรือาจ': 'หรืออาจ',
  'อย่าง่าย': 'อย่างง่าย',
  'รอยซีลเดิมาซีล': 'รอยซีลเดิมมาซีล',
  'หนึ่งมื้น': 'หนึ่งมื้อ',
  'ออกจากัน': 'ออกจากกัน',
  'กระดูก่อน': 'กระดูกก่อน',
  'ความชื้นี้': 'ความชื้นนี้',
  'ระบไร้อากาศ': 'ระบบไร้อากาศ',
  'การักษา': 'การรักษา',
  'หรือุ่น': 'หรืออุ่น',
  'แบ Sous-vide': 'แบบ Sous-vide',
  'ถูกักไว้': 'ถูกกักไว้',
  'หรืออกซิเจน': 'หรือออกซิเจน',
  'เนื่องจาก๊าซ': 'เนื่องจากก๊าซ',
  'สามารถูกดึง': 'สามารถถูกดึง',
  'แบเรียบ': 'แบบเรียบ',
  'ขั้นตอนี้': 'ขั้นตอนนี้',
  'ตรวจับ': 'ตรวจจับ'
};

const regexStr = Object.keys(typos).map(k => '.replace(/' + k + '/g, \'' + typos[k] + '\')').join('');

const injection = 
        if (loadedArticle.content) {
          loadedArticle.content = loadedArticle.content + regexStr + ;
        }
        if (loadedArticle.title) {
          loadedArticle.title = loadedArticle.title + regexStr + ;
        }
;

const insertPoint = content.indexOf('        setArticle(loadedArticle);');
if (insertPoint !== -1) {
    if (content.indexOf('// Safe fix loadedArticle') === -1) {
        content = content.substring(0, insertPoint) + '        // Safe fix loadedArticle\n' + injection + '\n' + content.substring(insertPoint);
        fs.writeFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', content);
        console.log('Safe fix applied to loadedArticle');
    } else {
        console.log('Already injected');
    }
} else {
    console.log('Insert point not found');
}

