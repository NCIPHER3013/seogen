const fs = require('fs');
const articles = JSON.parse(fs.readFileSync('articles_to_review.json', 'utf8'));
let combined = '';
articles.forEach((a, i) => {
    combined += '\n\n--- ARTICLE ' + i + ': ' + a.title + ' ---\n';
    let text = a.content.replace(/data:image\/[a-zA-Z]*;base64,[^\)]*/g, '[IMAGE]');
    combined += text;
});
fs.writeFileSync('clean_articles.txt', combined);
console.log('Cleaned text saved. Length:', combined.length);
