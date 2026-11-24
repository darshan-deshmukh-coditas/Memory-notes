# Spec 02: Date resolution

Turns due wording into a real calendar date, parses dates typed on the command line, and decides which status an item has on a given "today". Pure functions with an injected clock.

| Field | Value |
|---|---|
| Business reqs | BR-02, BR-04 |
| FRD | FR-I6, FR-L5, D1, D8 to D10, D33, D34, D36, D38, D44, D46, D47, D48, D49, D54 |
| NFRD | NFR-D2, D3, M2, C4, NFR-A7 |
| Modules | `dates/resolve.ts` (`resolveDue`, `parseCliDate`, `statusOf`), `clock.ts` |
| Tests | `tests/unit/dates.test.ts` |

## Behaviour

### Reference dates
1. Relative wording resolves against the **meeting date**, never the ingest date (D8.1).
2. "Today" is the system's local date, or the value of `--today` (D1.3, D54). Dates are calendar dates with no time and no timezone arithmetic. Only `statusOf` and `parseCliDate` read today.

### Finding the due phrase in an item's text (D48, D36, D49)
3. A due phrase is introduced by `by` or `due`, or by `on` or `from` when what follows resolves, or is `for <month name>`.
4. When there are several phrases, the **last one that resolves** is the due date (D48.1). `Sam to cut cloud costs by 10% — proposal by 2026-10-09` resolves to 2026-10-09; `by 10%` stays in the task.
5. The resolved phrase and the dash or comma that joined it are removed from the task text (D49). Unresolved phrases stay.
6. **Flagged** (no date, `dueFlagged = true`) only when a phrase introduced by `by`, `due` or `for <month name>` fails to resolve and no later phrase resolves (D48.2). A phrase introduced by `on` or `from` that does not resolve is plain task text and never flags (D48.3).
7. No due phrase at all means no date and no flag.

### Wording that resolves
| Wording | Result | Rule |
|---|---|---|
| `YYYY-MM-DD` | exact | D10.1 |
| `4 Mar`, `Mar 4`, `4 March 2026` | that date | D10.1 |
| `Oct 3rd`, `Oct 5th` (ordinals) | that date | D33.1 |
| `Wed 16 Sep`, `Saturday 10 Oct` | the explicit date | D33.1 |
| `from 9 Oct`, `on 2026-10-14`, `due 15 October` | that date | D33.1, D36.1 |
| `tomorrow` | meeting date + 1 | D8.3 |
| `EOD` | meeting date | D9.2 |
| `EOD tomorrow` | meeting date + 1 | D33 (open point in FRD, see Defaults) |
| `EOM`, `end of month` | last day of the meeting's month | D9.3, D33.2 |
| `next week` | Monday of the following calendar week | D9.1 |
| `end of next week` | Friday of the following calendar week | D33.2 |
| `next Tuesday` (any weekday) | that weekday in the following calendar week | D33.2 |
| weekday name or `Mon`..`Sun` | the next such day **strictly after** the meeting day | D8.2, D47.1 |

Worked examples (D33): `2026-09-03` is a Thursday, so `end of next week` is 2026-09-11. `2026-10-05` is a Monday, so `next Tuesday` is 2026-10-13. `by Friday` in a note dated on a Friday gives the following Friday.

### Missing year (D10.2, D34)
8. A date with no year uses the meeting's year. If that lands **more than 6 months before** the meeting date, it moves to the next year.

### Not resolved (flag, no date)
9. `03/04` slash dates are never guessed (D10.3). `mid-October`, `for November`, `sometime`, `by <date>` and anything else unlisted do not resolve (D33.3, D46.2, D9 leftovers such as `in 3 days`, `this week`).

### Disagreement (D33.4)
10. When a weekday and an explicit date disagree (`Wed 17 Sep`), the **explicit date wins** and a warning is returned.

### Command-line dates (D31.6, D38)
11. `parseCliDate` accepts ISO exactly. A value without a year uses **today's** year, with the 6-month rollover measured from today (D38.1). Anything else is an error that names the valid forms (NFR-U3).

### Status (D1, D44)
12. `statusOf(item, today)` returns exactly one of:
    - `done` if the stored status is done
    - `overdue` if open and `due < today`
    - `open` otherwise, including an item due today and an item with no due date
13. `overdue` is never stored (ADR 0002).

## Acceptance tests
- `D8.2` Friday on a Friday gives the next Friday
- `D9`, `D33.2` tomorrow, EOD, EOM, end of month, next week, next Tuesday, end of next week (the two worked examples)
- `D10`, `D33.1` ISO, month-name, ordinal and weekday-plus-date forms
- `D36.1` `due 15 October`; `D47.1` `by Mon`, `by Wed`
- `D34` year rollover (more than 6 months before the meeting date moves to next year)
- `D10.3` `03/04` is flagged, not guessed
- `D33.3`, `D46.2`, `D48.2` `mid-October`, `for November`, `by <date>` flagged
- `D48.1` `by 10% — proposal by 2026-10-09` gives 2026-10-09 and keeps `by 10%`
- `D48.3` `on the demo` and `from Acme` are never flagged
- `D33.4` weekday vs explicit date: explicit wins plus a warning
- `D38.1` `parseCliDate` year and rollover from today
- `D1.1`, `D1.2`, `D44.1` status: due today is open, no date is never overdue, exactly one status
- `D1.3`, `D54.1` `--today` makes results repeatable

## Defaults to confirm
- P7. Weekday names, month names and `EOD`/`EOM` are matched case-insensitively.
- P8. `EOD tomorrow` resolves to meeting date + 1 (an FRD "still open" point under D33).
- P9. Wording in D9 leftovers (`in 3 days`, `this week`, `end of week`, `tomorrow morning`) is flagged, as D9 implies.
