// Progress lives in the browser only. No account, no server.
const KEY = 'movers.progress.v1';

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

function writeAll(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode */ }
}

export function getChapter(id) {
  const all = readAll();
  return all[id] || { stages: {}, seen: [] };
}

export function markStage(id, stage, done = true) {
  const all = readAll();
  const c = all[id] || { stages: {}, seen: [] };
  c.stages[stage] = done;
  all[id] = c;
  writeAll(all);
  return c;
}

export function markSeen(id, word) {
  const all = readAll();
  const c = all[id] || { stages: {}, seen: [] };
  if (!c.seen.includes(word)) c.seen.push(word);
  all[id] = c;
  writeAll(all);
  return c;
}

export function starsFor(id, total = 5) {
  const c = getChapter(id);
  return Object.values(c.stages).filter(Boolean).length && total
    ? Object.values(c.stages).filter(Boolean).length
    : 0;
}

export function resetChapter(id) {
  const all = readAll();
  delete all[id];
  writeAll(all);
}
