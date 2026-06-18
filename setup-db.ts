async function run() {
  const token = "process.env.SUPABASE_SECRET_KEY || """;
  try {
    const res = await fetch("https://api.supabase.com/v1/projects", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();
