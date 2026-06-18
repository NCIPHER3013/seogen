fetch('http://localhost:3000/api/gemini/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'gemini-1.5-flash', contents: 'hello' })
}).then(res => res.json()).then(console.log).catch(console.error);
