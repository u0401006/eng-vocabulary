import { $, el } from './util.js';
import { getChapter } from './store.js';

const STAGES = 5;

async function main() {
  const res = await fetch('data/chapters/index.json');
  const data = await res.json();
  const grid = $('#chapters');
  grid.textContent = '';

  for (const ch of data.chapters) {
    const ready = ch.status === 'ready';
    const done = Object.values(getChapter(ch.id).stages || {}).filter(Boolean).length;
    const card = el('a', {
      class: 'chap' + (ready ? '' : ' locked'),
      href: ready ? `chapter.html?id=${ch.id}` : '#',
      'aria-disabled': ready ? null : 'true'
    }, [
      el('span', { class: 'letters', text: ch.letters }),
      el('h3', { text: ready ? ch.title : 'Coming soon' }),
      el('p', { text: ready ? `${ch.words} words · 5 steps` : 'Not ready yet.' }),
      ready ? el('div', {
        class: 'stars',
        text: '★'.repeat(done) + '☆'.repeat(STAGES - done),
        title: `${done} of ${STAGES} steps finished`
      }) : null
    ]);
    grid.append(card);
  }
}

$('#resetAll').addEventListener('click', () => {
  if (!confirm('Clear all stars and start again?')) return;
  try { localStorage.removeItem('movers.progress.v1'); } catch {}
  location.reload();
});

main().catch(err => {
  $('#chapters').textContent = 'Could not load the chapters. Please open this page through a web server.';
  console.error(err);
});
