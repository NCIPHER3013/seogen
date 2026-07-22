import fetch from 'node-fetch';

async function testRoleUpdate() {
  try {
    const res = await fetch('http://localhost:5173/api/admin/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'fake-id', role: 'admin' })
    });
    console.log(res.status, await res.text());
  } catch (e) {
    console.error(e);
  }
}

testRoleUpdate();
