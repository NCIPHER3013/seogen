const fs = require('fs');

const wrongWords = [
    [/ช่องแช่อย่างไรก็ตาม/g, 'ช่องแช่ อย่างไรก็ตาม'],
    [/รักษาคุณภาพสินค้\b/g, 'รักษาคุณภาพสินค้า'],
    [/กระดูกคมาก/g, 'กระดูกคมมาก'],
    [/คุ้มค่าการลงทุด/g, 'คุ้มค่าการลงทุน'],
    [/การปฏิบัติตามาตรฐาน/g, 'การปฏิบัติตามมาตรฐาน'],
    [/แรงกดันสูง/g, 'แรงกดดันสูง'],
    [/ถุงแบางทั่วไป/g, 'ถุงบางทั่วไป'],
    [/มีการะบุความหนา/g, 'มีการระบุความหนา'],
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
    console.log('Successfully injected final typo rules 2 into ArticleEditor.tsx');
} else {
    console.log('Regex did not match.');
}
