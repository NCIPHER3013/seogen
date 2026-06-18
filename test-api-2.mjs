fetch('http://localhost:3000/api/gemini/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': 'sk-test' },
  body: JSON.stringify({ model: 'gpt-4o-mini', contents: 'hello' })
}).then(res => res.json()).then(console.log).catch(console.error);
