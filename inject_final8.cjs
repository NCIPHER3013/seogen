const fs = require('fs');

const wrongWords = [
    [/เครื่องใช้ไฟ้า/g, 'เครื่องใช้ไฟฟ้า'],
    [/แรงานคน/g, 'แรงงานคน'],
    [/สะอาด้วย/g, 'สะอาดด้วย'],
    [/สะอาดี/g, 'สะอาดดี'],
    [/ผักาด/g, 'ผักกาด']
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
    console.log('Successfully injected final typo rules 8 into ArticleEditor.tsx');
} else {
    console.log('Regex did not match.');
}
