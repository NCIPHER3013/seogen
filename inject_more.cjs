const fs = require('fs');

const wrongWords = [
    [/การับประกัน/g, 'การรับประกัน'],
    [/น้ำมันเยิ้น/g, 'น้ำมันเยิ้ม'],
    [/มิลิเมตร/g, 'มิลลิเมตร'],
    [/ตอบแบ/g, 'ตอบแบบ'],
    [/ดูดแบเป็น/g, 'ดูดแบบเป็น']
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
    console.log('Successfully injected newest typo rules into ArticleEditor.tsx');
} else {
    console.log('Regex did not match.');
}
