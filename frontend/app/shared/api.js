export async function fetchJson(url, fallback = []) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("request failed");
    return await r.json();
  } catch {
    return fallback;
  }
}

export async function postJson(url, payload) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("request failed");
  return r.json();
}
