const fs = require('fs');

const wrongWords = [
    [/ห่อาหาร/g, 'ห่ออาหาร'],
    [/จุดังกล่าว/g, 'จุดดังกล่าว'],
    [/อาหาระบุว่า/g, 'อาหารระบุว่า'],
    [/ไม่ได้ถุงเรียบ/g, 'ไม่ได้ ถุงเรียบ'],
    [/แบใช้แผ่นดูด/g, 'แบบใช้แผ่นดูด'],
    [/ขนอ่นุ่ม/g, 'ขนอ่อนนุ่ม'],
    [/ขนอ่น/g, 'ขนอ่อน'],
    [/ความั่นใจ/g, 'ความมั่นใจ'],
    [/ใน้ำอุ่น/g, 'ในน้ำอุ่น'],
    [/อัตราส่วน้ำ/g, 'อัตราส่วนน้ำ'],
    [/กลิ่น้ำยา/g, 'กลิ่นน้ำยา'],
    [/ถุงลาย่น/g, 'ถุงลายย่น'],
    [/หรือุดตัน/g, 'หรืออุดตัน'],
    [/เป็นิสัย/g, 'เป็นนิสัย'],
    [/การู้คำตอบ/g, 'การรู้คำตอบ'],
    [/ข้อจำกัด้าน/g, 'ข้อจำกัดด้าน'],
    [/การีไซเคิล/g, 'การรีไซเคิล'],
    [/ใน้ำเดือด/g, 'ในน้ำเดือด'],
    [/สเปการรับรอง/g, 'สเปกการรับรอง'],
    [/ออก่อน/g, 'ออกก่อน'],
    [/หรือุ่น/g, 'หรืออุ่น'],
    [/การักษาสภาพ/g, 'การรักษาสภาพ'],
    [/แห้งจี๋/g, 'แห้งสนิท'],
    [/ระบโลจิสติกส์/g, 'ระบบโลจิสติกส์'],
    [/ควบคุ/g, 'ควบคุม'],
    [/ควบคุมมมม/g, 'ควบคุม'],
    [/การู้วิธี/g, 'การรู้วิธี'],
    [/ปลอดภัยิ่ง/g, 'ปลอดภัยยิ่ง'],
    [/การับมือ/g, 'การรับมือ']
];

let text = fs.readFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', 'utf8');

const regex = /(markdown = markdown\.replace[\s\S]*?;\n)/;
const match = text.match(regex);
if (match) {
    let replacedLine = match[1].trim();
    replacedLine = replacedLine.replace(/;$/, '');
    
    // Check and add each rule if not already present
    for (const [pattern, replacement] of wrongWords) {
        const pStr = pattern.toString();
        if (!replacedLine.includes(pStr)) {
            replacedLine += `\n      .replace(${pStr}, '${replacement}')`;
        }
    }
    
    replacedLine += ';\n';
    text = text.replace(regex, '  ' + replacedLine);
    fs.writeFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', text, 'utf8');
    console.log('Successfully injected massive typo rules into ArticleEditor.tsx');
} else {
    console.log('Regex did not match.');
}
