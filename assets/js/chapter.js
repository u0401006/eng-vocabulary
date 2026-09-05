import { $, el, shuffleHard } from './util.js';
import { initVoices, speak, canSpeak } from './speak.js';
import { getChapter, markStage, markSeen } from './store.js';

const STAGES = [
  { key: 'words',     name: '1 · Words',     sub: 'See it, hear it' },
  { key: 'chunks',    name: '2 · Word pairs', sub: 'Words that go together' },
  { key: 'sentences', name: '3 · Sentences',  sub: 'Build the line' },
  { key: 'story',     name: '4 · Story',      sub: 'Read it out loud' },
  { key: 'check',     name: '5 · Check',      sub: 'Answer and retell' }
];

const id = new URLSearchParams(location.search).get('id') || 'ab';
let data = null;
let current = 'words';

/* ------------------------------------------------------------------ shell */

function paint() {
  const prog = getChapter(id);
  const nav = $('#stages');
  nav.textContent = '';
  for (const s of STAGES) {
    nav.append(el('button', {
      type: 'button',
      class: prog.stages[s.key] ? 'done' : '',
      'aria-current': s.key === current ? 'true' : 'false',
      onclick: () => { current = s.key; paint(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    }, [el('span', { text: s.name }), el('small', { text: s.sub })]));
  }
  const done = STAGES.filter(s => prog.stages[s.key]).length;
  $('#bar').style.width = `${(done / STAGES.length) * 100}%`;

  const panel = $('#panel');
  panel.textContent = '';
  ({ words: stageWords, chunks: stageChunks, sentences: stageSentences,
     story: stageStory, check: stageCheck })[current](panel);
}

function finish(key, msg) {
  markStage(id, key);
  const next = STAGES[STAGES.findIndex(s => s.key === key) + 1];
  const box = el('div', {}, [
    el('p', { class: 'flash ok', text: msg }),
    el('div', { class: 'rowbtns' }, [
      next
        ? el('button', { class: 'btn', type: 'button', onclick: () => { current = next.key; paint(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, text: `Next: ${next.name.split('· ')[1]} →` })
        : el('a', { class: 'btn', href: 'index.html', text: 'Back to all chapters' })
    ])
  ]);
  return box;
}

function head(panel, title, hint) {
  panel.append(el('h2', { text: title }), el('p', { class: 'hint', text: hint }));
}

/* ------------------------------------------------- stage 1 · word wall */

function stageWords(panel) {
  head(panel, 'Words', 'Tap a card. Say the word, then look at the meaning.');
  const prog = getChapter(id);
  const wall = el('div', { class: 'words' });
  const footer = el('div', { class: 'rowbtns' });

  const update = () => {
    const seen = getChapter(id).seen.length;
    btn.disabled = seen < data.words.length;
    btn.textContent = seen < data.words.length
      ? `Open every card (${seen}/${data.words.length})`
      : 'I know these words →';
  };

  const btn = el('button', {
    class: 'btn', type: 'button',
    onclick: () => { footer.after(finish('words', 'Good. Now let us put the words together.')); btn.disabled = true; }
  });

  for (const item of data.words) {
    const card = el('button', {
      type: 'button',
      class: 'wordcard' + (prog.seen.includes(item.w) ? ' seen' : ''),
      onclick: () => {
        card.classList.toggle('open');
        card.classList.add('seen');
        markSeen(id, item.w);
        speak(item.w);
        update();
      }
    }, [
      el('span', { class: 'emoji', text: item.emoji }),
      el('span', { class: 'w', text: item.w }),
      el('span', { class: 'pos', text: item.pos }),
      el('span', { class: 'def', text: item.def }),
      el('span', { class: 'eg', text: item.eg })
    ]);
    wall.append(card);
  }

  panel.append(wall, footer);
  footer.append(btn);
  update();
}

/* ---------------------------------------------------- stage 2 · chunks */

function stageChunks(panel) {
  head(panel, 'Word pairs', 'Words travel with friends. Tap a word on the left, then its friend on the right.');
  const board = el('div', { class: 'chunkboard' });
  const left = el('div', { class: 'chunkcol' });
  const right = el('div', { class: 'chunkcol' });
  const flash = el('p', { class: 'flash' });
  let picked = null, matched = 0;

  const leftBtns = new Map(), rightBtns = new Map();

  shuffleHard(data.chunks).forEach((c, i) => {
    const b = el('button', {
      type: 'button', class: 'chunk', 'aria-pressed': 'false', text: c.head,
      onclick: () => {
        if (b.classList.contains('matched')) return;
        if (picked) picked.setAttribute('aria-pressed', 'false');
        picked = b; b.setAttribute('aria-pressed', 'true');
        speak(c.head);
      }
    });
    leftBtns.set(c.head, b);
    left.append(b);
  });

  shuffleHard(data.chunks).forEach(c => {
    const b = el('button', {
      type: 'button', class: 'chunk', text: c.tail,
      onclick: () => {
        if (b.classList.contains('matched') || !picked) return;
        const wanted = leftBtns.get(c.head);
        if (picked === wanted) {
          picked.classList.add('matched'); b.classList.add('matched');
          picked.setAttribute('aria-pressed', 'false');
          picked = null; matched++;
          flash.className = 'flash ok'; flash.textContent = c.sentence;
          speak(c.sentence);
          if (matched === data.chunks.length) {
            flash.textContent = 'Every pair is together.';
            panel.append(finish('chunks', 'Now you can build a whole sentence.'));
          }
        } else {
          b.classList.add('wrong');
          setTimeout(() => b.classList.remove('wrong'), 500);
          flash.className = 'flash no'; flash.textContent = 'Not that one. Try again.';
        }
      }
    });
    rightBtns.set(c.tail, b);
    right.append(b);
  });

  board.append(left, right);
  panel.append(board, flash);
}

/* ------------------------------------------------- stage 3 · sentences */

function stageSentences(panel) {
  head(panel, 'Sentences', 'Tap the words in the right order. Tap a word again to take it back.');
  const counter = el('p', { class: 'counter' });
  const drop = el('div', { class: 'drop' });
  const bank = el('div', { class: 'bank' });
  const flash = el('p', { class: 'flash' });
  const nextBtn = el('button', { class: 'btn', type: 'button', text: 'Next sentence →', disabled: 'disabled' });
  let idx = 0;

  function load() {
    const target = data.sentences[idx].split(' ');
    counter.textContent = `Sentence ${idx + 1} of ${data.sentences.length}`;
    drop.textContent = ''; drop.className = 'drop';
    bank.textContent = ''; flash.textContent = ''; flash.className = 'flash';
    nextBtn.disabled = true;
    const built = [];

    const check = () => {
      if (built.length !== target.length) return;
      if (built.join(' ') === target.join(' ')) {
        drop.classList.add('ok');
        flash.className = 'flash ok'; flash.textContent = 'Yes! Listen to it.';
        speak(target.join(' ') + '.');
        nextBtn.disabled = false;
        [...bank.children].forEach(c => c.disabled = true);
      } else {
        flash.className = 'flash no';
        flash.textContent = 'Close. Move one word and try again.';
      }
    };

    shuffleHard(target).forEach((word, i) => {
      const tok = el('button', {
        type: 'button', class: 'tok', text: word,
        onclick: () => {
          tok.style.display = 'none';
          built.push(word);
          const back = el('button', {
            type: 'button', class: 'tok', text: word,
            onclick: () => {
              const at = built.lastIndexOf(word);
              if (at > -1) built.splice(at, 1);
              back.remove(); tok.style.display = '';
              drop.classList.remove('ok'); flash.textContent = '';
            }
          });
          drop.append(back);
          check();
        }
      });
      bank.append(tok);
    });
  }

  nextBtn.addEventListener('click', () => {
    idx++;
    if (idx < data.sentences.length) { load(); return; }
    nextBtn.disabled = true;
    panel.append(finish('sentences', 'You built every sentence. Time for the story.'));
  });

  panel.append(counter, drop, bank, flash, el('div', { class: 'rowbtns' }, [nextBtn]));
  load();
}

/* ----------------------------------------------------- stage 4 · story */

function stripMarks(line) { return line.replace(/\*\*/g, ''); }

function stageStory(panel) {
  head(panel, data.title, 'Tap any dark word to hear it. Hide the words and let the child guess them.');
  const story = el('div', { class: 'story' });

  for (const line of data.story) {
    const p = el('p');
    line.split(/(\*\*[^*]+\*\*)/).forEach(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const w = part.slice(2, -2);
        p.append(el('span', {
          class: 'tw', tabindex: '0', role: 'button', text: w,
          onclick: e => { e.currentTarget.classList.remove('hide'); speak(w); },
          onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }
        }));
      } else if (part) {
        p.append(document.createTextNode(part));
      }
    });
    p.addEventListener('dblclick', () => speak(stripMarks(line)));
    story.append(p);
  }

  const hideBtn = el('button', {
    class: 'btn ghost', type: 'button', text: 'Hide the words',
    onclick: () => {
      const on = hideBtn.dataset.on === '1';
      hideBtn.dataset.on = on ? '0' : '1';
      hideBtn.textContent = on ? 'Hide the words' : 'Show the words';
      story.querySelectorAll('.tw').forEach(s => s.classList.toggle('hide', !on));
    }
  });

  let reading = false;
  const readBtn = el('button', {
    class: 'btn', type: 'button', text: canSpeak() ? 'Read it to me' : 'No voice on this device',
    onclick: () => {
      if (!canSpeak()) return;
      if (reading) { speechSynthesis.cancel(); reading = false; readBtn.textContent = 'Read it to me'; return; }
      reading = true; readBtn.textContent = 'Stop';
      let i = 0;
      const step = () => {
        if (!reading || i >= data.story.length) { reading = false; readBtn.textContent = 'Read it to me'; return; }
        const u = new SpeechSynthesisUtterance(stripMarks(data.story[i++]));
        u.lang = 'en-GB'; u.rate = 0.82;
        u.onend = step;
        speechSynthesis.speak(u);
      };
      speechSynthesis.cancel();
      step();
    }
  });

  panel.append(story, el('div', { class: 'rowbtns' }, [
    readBtn, hideBtn,
    el('button', {
      class: 'btn ghost', type: 'button', text: 'We read it →',
      onclick: e => { speechSynthesis && speechSynthesis.cancel(); reading = false; e.currentTarget.disabled = true; panel.append(finish('story', 'Now check what the child understood.')); }
    })
  ]));
}

/* ----------------------------------------------------- stage 5 · check */

function stageCheck(panel) {
  head(panel, 'Check', 'Five questions, then tell the story again in four lines.');
  let right = 0;
  const total = data.quiz.length;

  data.quiz.forEach((q, qi) => {
    const box = el('div', { class: 'q' });
    box.append(el('p', { text: `${qi + 1}. ${q.q}` }));
    const opts = el('div', { class: 'opts' });
    let answered = false;
    q.options.forEach((text, oi) => {
      const b = el('button', {
        type: 'button', class: 'opt', text,
        onclick: () => {
          if (answered) return;
          if (oi === q.a) {
            answered = true; right++;
            b.classList.add('right'); speak(text);
            [...opts.children].forEach(c => c.disabled = true);
            maybeRetell();
          } else {
            b.classList.add('wrongpick'); b.disabled = true;
          }
        }
      });
      opts.append(b);
    });
    box.append(opts);
    panel.append(box);
  });

  const retellBox = el('div');
  panel.append(retellBox);

  function maybeRetell() {
    if (right < total || retellBox.childElementCount) return;
    retellBox.append(el('h2', { text: 'Now retell it' }),
      el('p', { class: 'hint', text: 'Put the four lines in order. Say each one out loud.' }));

    const slots = el('div', { class: 'retell' });
    const flash = el('p', { class: 'flash' });
    let step = 0;
    const buttons = shuffleHard(data.retell).map(line => el('button', {
      type: 'button', class: 'tok', text: line,
      onclick: () => {
        if (line === data.retell[step]) {
          const b = buttons.find(x => x.textContent === line);
          b.className = 'opt right'; b.disabled = true; speak(line);
          step++;
          flash.className = 'flash ok'; flash.textContent = `${step} of ${data.retell.length}`;
          if (step === data.retell.length) {
            flash.textContent = 'That is the whole story in four lines.';
            retellBox.append(finish('check', 'Chapter finished. The child owns this story now.'));
          }
        } else {
          flash.className = 'flash no'; flash.textContent = 'Not this line yet. Which one comes first?';
        }
      }
    }));
    buttons.forEach(b => slots.append(b));
    retellBox.append(slots, flash);
  }
}

/* ----------------------------------------------------------- grown-ups */

function paintNotes() {
  const box = $('#notes');
  box.textContent = '';
  box.append(el('h3', { text: 'How to read this chapter' }));
  box.append(el('ul', {}, data.notes.reading.map(t => el('li', { text: t }))));
  box.append(el('h3', { text: 'Language notes' }));
  box.append(el('ul', {}, data.notes.teaching.map(t => el('li', { text: t }))));
}

$('#parentBtn').addEventListener('click', e => {
  const box = $('#notes');
  box.hidden = !box.hidden;
  e.currentTarget.setAttribute('aria-pressed', String(!box.hidden));
  if (!box.hidden) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ---------------------------------------------------------------- boot */

initVoices();

fetch(`data/chapters/${id}.json`)
  .then(r => { if (!r.ok) throw new Error('missing chapter'); return r.json(); })
  .then(json => {
    data = json;
    document.title = `${json.title} · A1 Movers`;
    $('#chTitle').textContent = `${json.letters} · ${json.title}`;
    $('#chBlurb').textContent = json.blurb;
    const prog = getChapter(id);
    current = (STAGES.find(s => !prog.stages[s.key]) || STAGES[0]).key;
    paintNotes();
    paint();
  })
  .catch(err => {
    $('#chTitle').textContent = 'This chapter is not ready yet.';
    $('#panel').append(el('p', { text: 'Please go back and choose chapter A - B.' }),
      el('div', { class: 'rowbtns' }, [el('a', { class: 'btn', href: 'index.html', text: 'Back to all chapters' })]));
    console.error(err);
  });
