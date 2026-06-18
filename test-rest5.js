import https from 'https';

const apiKey = "process.env.GEMINI_API_KEY || """;
const prompt = "a dog";

const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body.substring(0, 500)));
});
req.on('error', e => console.error(e));
req.write(JSON.stringify({
  instances: [{ prompt: prompt }],
  parameters: { sampleCount: 1 }
}));
req.end();
