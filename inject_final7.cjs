const fs = require('fs');

const wrongWords = [
    [/แล้วางไว้/g, 'แล้ววางไว้'],
    [/พิจารณาแล้ว่า/g, 'พิจารณาแล้วว่า'],
    [/เดียวกันี้/g, 'เดียวกันนี้'],
    [/เช่น้ำเลือด/g, 'เช่น น้ำเลือด']
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
    console.log('Successfully injected final typo rules 7 into ArticleEditor.tsx');
} else {
    console.log('Regex did not match.');
}
