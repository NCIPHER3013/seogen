import https from 'https';

const apiKey = "process.env.GEMINI_API_KEY || """;
const prompt = "hello";

const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body.substring(0, 500)));
});
req.on('error', e => console.error(e));
req.write(JSON.stringify({
  contents: [{ role: "user", parts: [{ text: prompt }] }]
}));
req.end();
