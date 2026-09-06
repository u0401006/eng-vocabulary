# A1 Movers — Word to Story

Interactive practice for the **Cambridge A1 Movers** word list, built around one idea:
a child at this level does not need more words to memorise, they need four connections.

| Layer | Goal | In the app |
|---|---|---|
| 1. Word ↔ picture | see `balcony`, picture a balcony | word wall: emoji, sound, meaning in simple English |
| 2. Word ↔ chunk | `afraid of the dark`, not `afraid = scared` | word-pair matching |
| 3. Sentence ↔ situation | who, where, what is happening | sentence building |
| 4. Sentence ↔ text | tell the whole story | story reader, questions, four-line retell |

Everything on the page is in English on purpose. The child should reach the meaning
through the picture and the sentence, not through a translation.

## Chapters

Words appear in word-list order, about two letters per chapter (13 chapters).
Each chapter ends in one story that uses every target word of that chapter, written
and rewritten until it stays inside A1 grammar.

Ready now: **A–B — Billy and the Toy Bear** (44 words).
The other chapters are listed but not written yet.

## The five steps in a chapter

1. **Words** — tap a card to hear the word and open its meaning.
2. **Word pairs** — match each word with the words it travels with.
3. **Sentences** — tap the words back into the right order.
4. **Story** — read it together. Tap any dark word to hear it, or hide the dark
   words and let the child guess them from the situation.
5. **Check** — five comprehension questions, then put the story back together in four lines.

Progress (stars per chapter) is kept in the browser with `localStorage`. No account, no server.

## Grown-up notes

The **Grown-up notes** button on a chapter page shows how to read the chapter
(four passes: listen, guess, answer, retell) and the language notes for that chapter —
for example why it is `the puppy smells bad` but `Billy walks badly`.

## Run it

Plain static files, no build step. It must be served over HTTP (the chapters are
fetched as JSON), so opening `index.html` from disk will not work.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Read-aloud uses the browser's own speech engine (`en-GB` when the device has it).
No audio files, no network calls.

## Publishing

`.github/workflows/pages.yml` deploys the site on every push to `main`.

Pages has to be switched on once by hand first: **Settings → Pages → Build and
deployment → Source: GitHub Actions**. The workflow token is not allowed to do
this for the repository, so until it is set the deploy job stops at
`Create Pages site failed`. After switching it on, re-run the workflow from the
Actions tab and the site goes live at `https://<user>.github.io/eng-vocabulary/`.

## Adding a chapter

1. Write `data/chapters/<id>.json` — the format is described in `data/schema.md`.
2. Flip that chapter's `status` to `"ready"` in `data/chapters/index.json`.

No JavaScript changes are needed; the engine renders whatever the JSON contains.

## Layout

```
index.html            chapter list
chapter.html          one chapter, five steps
assets/js/chapter.js  the five step renderers
assets/js/store.js    progress in localStorage
assets/js/speak.js    text to speech
data/chapters/        the content
```
