const fs = require('fs');

const wrongWords = [
    [/แบใดีที่สุด/g, 'แบบไหนดีที่สุด'],
    [/การะบายแรงดัน/g, 'การระบายแรงดัน'],
    [/กระดาษทิชู่/g, 'กระดาษทิชชู่'],
    [/ทิชู่/g, 'ทิชชู่'],
    [/ผลัพธ์/g, 'ผลลัพธ์'],
    [/คือุปกรณ์/g, 'คืออุปกรณ์'],
    [/อาหาระดับ/g, 'อาหารระดับ'],
    [/\bโรงาน\b/g, 'โรงงาน'], // Word boundary might not work well with Thai, let's just use โรงาน -> โรงงาน
    [/โรงาน/g, 'โรงงาน'],
    [/เหลืออก/g, 'เหลือออก'],
    [/การะบายอากาศ/g, 'การระบายอากาศ'],
    [/จาการ/g, 'จากการ'],
    [/สมบูรณ์แบ\b/g, 'สมบูรณ์แบบ'],
    [/ซื้อุปกรณ์/g, 'ซื้ออุปกรณ์']
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
    console.log('Successfully injected final typo rules 3 into ArticleEditor.tsx');
} else {
    console.log('Regex did not match.');
}
