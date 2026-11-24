# Test fixtures

Tiny synthetic notes so unit tests do not depend on the full `notes/` sample folder.

| File | Exercises |
|---|---|
| `notes/labelled-basic.md` | labelled header, long date, ambiguous Priya/`Priya N.`, done item, no-owner, group, undated |
| `notes/yaml-basic.md` | YAML front matter, attendee email, weekday and ISO due dates |
| `notes/traps.md` | block quote, code fence, HTML comment, table row, `ACTION:`, numbered checkbox (all ignored) |
| `notes/bad-date.md` | unparseable header date, skipped note (D22.1) |

Create other malformed inputs (empty file, non-UTF-8 bytes) in a temp dir inside the test, since editors can silently rewrite them.
