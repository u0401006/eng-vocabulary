// Text to speech. British English first: the course is Cambridge.
let voice = null;

function pick() {
  const all = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  if (!all.length) return null;
  return all.find(v => v.lang === 'en-GB')
      || all.find(v => v.lang && v.lang.startsWith('en-GB'))
      || all.find(v => v.lang && v.lang.startsWith('en'))
      || all[0];
}

export function initVoices() {
  if (!window.speechSynthesis) return;
  voice = pick();
  speechSynthesis.onvoiceschanged = () => { voice = pick(); };
}

export function speak(text, { rate = 0.85 } = {}) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (!voice) voice = pick();
  if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-GB'; }
  u.rate = rate;
  u.pitch = 1.05;
  speechSynthesis.speak(u);
}

export function canSpeak() { return !!window.speechSynthesis; }
