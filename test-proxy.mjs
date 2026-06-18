import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/gemini/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'process.env.GEMINI_API_KEY || ""'
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', e => console.error('Error:', e.message));
req.write(JSON.stringify({ model: 'gemini-2.5-pro', contents: 'hello' }));
req.end();
