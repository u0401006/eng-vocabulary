# Chapter file format

One JSON file per chapter in `data/chapters/<id>.json`, plus one row in
`data/chapters/index.json`. The app renders whatever is here — adding a chapter
never requires touching the JavaScript.

## index.json

```json
{ "id": "ab", "letters": "A - B", "title": "Billy and the Toy Bear", "words": 44, "status": "ready" }
```

`status` is `"ready"` or `"soon"`. A `"soon"` chapter shows as locked.

## <id>.json

| Field | Type | Notes |
|---|---|---|
| `id`, `letters`, `title` | string | must match the row in `index.json` |
| `blurb` | string | one line under the chapter title |
| `words[]` | `{w, pos, def, emoji, eg}` | `def` is a child-level English gloss, never a translation; `eg` is the sentence the word has in the story |
| `chunks[]` | `{head, tail, sentence}` | step 2 matching pairs; `sentence` is spoken on a correct match |
| `sentences[]` | string | step 3, **no final full stop** — the words are split on spaces and each becomes one tile |
| `story[]` | string | one paragraph per item; wrap a target word in `**stars**` to make it tappable and hideable |
| `quiz[]` | `{q, options[], a}` | `a` is the 0-based index of the right option |
| `retell[]` | string | four lines, already in the right order; the app shuffles them |
| `notes.reading[]` | string | how a grown-up should run the chapter |
| `notes.teaching[]` | string | grammar traps in this chapter |

## Writing rules for a chapter

- **Word order follows the official word list.** Do not reorder words to make the story easier.
- **Every target word appears in the story**, marked with `**stars**`.
- **A1 grammar only**: mostly present simple and present continuous, one idea per sentence,
  linking words limited to `and`, `but`, `because`, `then`, `so`.
- **Never force a word into a wrong slot.** If the natural sentence needs
  `smells bad`, use `walks badly` somewhere else instead of writing broken English —
  and record the trap in `notes.teaching`.
- **The story is written more than once.** Draft plain sentences, then add one task
  the characters share, then a character and a twist, then cut the grammar back to A1,
  then a final pass. Only the last version ships.
- `quiz` asks where / what / why / where / why — situation questions, not word definitions.
- `retell` is the whole story in four short sentences a child can say from memory.
