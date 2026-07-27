const fs = require('fs');

const wrongWords = [
    [/เปิด้วย/g, 'เปิดด้วย'],
    [/ตั้งใจะนำ/g, 'ตั้งใจจะนำ'],
    [/มื้อาหาร/g, 'มื้ออาหาร'],
    [/เซล์ผัก/g, 'เซลล์ผัก']
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
    console.log('Successfully injected final typo rules 6 into ArticleEditor.tsx');
} else {
    console.log('Regex did not match.');
}
