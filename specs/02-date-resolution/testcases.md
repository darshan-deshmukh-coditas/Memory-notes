# Test cases: 02 Date resolution

All unit tests go in `tests/unit/dates.test.ts` unless noted. Test names start with the cited spec ID in brackets, as CLAUDE.md requires. Type column: `unit`, `unit (negative)` for bad input that must be flagged or rejected and never thrown from `resolveDue`/`findDuePhrase`, or `property` (generated inputs, fixed seed). "Expected" gives the result: `date X` means `kind: "date"`, `due X`; `flagged` means `kind: "flagged"` (`due null`, `dueFlagged true`); `none` means no date and no flag. Open-question defaults are marked **(OQ-n)** and must be re-checked once the user answers.

Meeting dates use the calendar in the fixtures section. Results for `statusOf` use `today` passed in, never the system clock.

## Reference and anchoring

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected |
|---|---|---|---|---|---|---|
| TC-01 | D8.1 | dates.test.ts | [D8.1] relative words anchor on the meeting date, not the system date | unit | `resolveDue("tomorrow", "2026-09-30")` with `vi.setSystemTime("2026-10-20")` | `date 2026-10-01` (unchanged by system time) |
| TC-41 | D1.3 | dates.test.ts | [D1.3] systemClock returns the local calendar date | unit | fake time `new Date(2026, 9, 20, 23, 30)` local | `2026-10-20` in any TZ |
| TC-42 | NFR-M2 | dates.test.ts | [NFR-M2] statusOf and parseCliDate depend only on the injected today | unit | same arguments with system time changed twice | same output both times |
| TC-48 | D1.3 | dates.test.ts | [D1.3] an explicit today changes overdue and repeats for the same input | unit | item `due 2026-10-20`, today `2026-10-21`, then twice | `overdue`, then `overdue` again |

## Weekdays and relative words

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected |
|---|---|---|---|---|---|---|
| TC-02 | D8.2 | dates.test.ts | [D8.2] Friday on a Friday gives the following Friday | unit | `Friday`, meeting `2026-10-09` | `date 2026-10-16` |
| TC-03 | D8.2 | dates.test.ts | [D8.2] Friday on a Monday gives this week's Friday | unit | `Friday`, meeting `2026-10-05` | `date 2026-10-09` |
| TC-04 | D8.2, D47.1 | dates.test.ts | [D8.2] abbreviations Mon and Wed resolve like full names | unit | `by Mon` and `by Wed`, meeting `2026-09-11` (Fri) | `2026-09-14` and `2026-09-16` |
| TC-05 | D66.1 | dates.test.ts | [D66.1] weekday names are case-insensitive | unit | `by friday`, `by Friday`, `by FRIDAY`, meeting `2026-10-05` | all `date 2026-10-09` |
| TC-06 | D9.2 | dates.test.ts | [D9.2] EOD resolves to the meeting date | unit | `EOD`, meeting `2026-09-03` | `date 2026-09-03` |
| TC-07 | D8.3 | dates.test.ts | [D8.3] tomorrow is the meeting date plus one | unit | `tomorrow`, meeting `2026-09-30` | `date 2026-10-01` |
| TC-08 | D66.2 | dates.test.ts | [D66.2] EOD tomorrow is the meeting date plus one | unit | `EOD tomorrow`, meeting `2026-09-30` | `date 2026-10-01` |
| TC-09 | D9.3 | dates.test.ts | [D9.3] EOM is the last day of the meeting's month | unit | `EOM`, meeting `2026-09-03` | `date 2026-09-30` |
| TC-10 | D33.2 | dates.test.ts | [D33.2] end of month equals EOM, including when the meeting is the last day | unit | `end of month`, meeting `2026-09-30` | `date 2026-09-30` |
| TC-11 | D9.1 | dates.test.ts | [D9.1] next week is the Monday of the following calendar week | unit | `next week`, meeting `2026-10-07` (Wed) | `date 2026-10-12` |
| TC-12 | D33.2 | dates.test.ts | [D33.2] next Tuesday from 2026-10-05 is 2026-10-13 (worked example) | unit | `next Tuesday`, meeting `2026-10-05` | `date 2026-10-13` |
| TC-13 | D33.2 | dates.test.ts | [D33.2] end of next week from 2026-09-03 is 2026-09-11 (worked example) | unit | `end of next week`, meeting `2026-09-03` | `date 2026-09-11` |
| TC-14 | D33.2, D8.2 | dates.test.ts | [D33.2] bare Tuesday and next Tuesday differ on a Monday meeting | unit | `Tuesday` and `next Tuesday`, meeting `2026-10-05` | `2026-10-06` and `2026-10-13` |
| TC-59 | D9.1 **(OQ-3)** | dates.test.ts | [D9.1] next week from a Sunday meeting uses the ISO week | unit | `next week`, meeting `2026-10-11` (Sun) | `date 2026-10-12` |
| TC-60 | D33.2 **(OQ-3)** | dates.test.ts | [D33.2] next Tuesday from a Sunday meeting uses the ISO week | unit | `next Tuesday`, meeting `2026-10-11` | `date 2026-10-13` |

## Absolute dates, ordinals, prefixes

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected |
|---|---|---|---|---|---|---|
| TC-15 | D10.1 | dates.test.ts | [D10.1] ISO date is exact | unit | `2026-10-14`, meeting `2026-09-03` | `date 2026-10-14` |
| TC-16 | D10.1, D10.2, D34.1 | dates.test.ts | [D10.1] `4 Mar` and `Mar 4` use the meeting year when not more than 6 months before | unit | `4 Mar`, `Mar 4`, meeting `2026-09-03` | both `date 2026-03-04` |
| TC-17 | D10.1 | dates.test.ts | [D10.1] `4 March 2026` is exact | unit | `4 March 2026`, meeting `2026-09-03` | `date 2026-03-04` |
| TC-18 | D33.1 | dates.test.ts | [D33.1] ordinals `Oct 3rd` and `Oct 5th` resolve | unit | `Oct 3rd`, `Oct 5th`, meeting `2026-09-03` | `2026-10-03`, `2026-10-05` |
| TC-19 | D33.1 | dates.test.ts | [D33.1] weekday plus date resolves to the explicit date with no warning when they agree | unit | `Wed 16 Sep`, `Saturday 10 Oct`, meeting `2026-09-03` | `date 2026-09-16` and `date 2026-10-10`, no warning |
| TC-20 | D33.4 | dates.test.ts | [D33.4] weekday and explicit date disagree: explicit wins and a warning is returned | unit | `Wed 17 Sep`, meeting `2026-09-03` | `date 2026-09-17` with a non-empty `warning` (17 Sep is a Thursday) |
| TC-21 | D36.1, D33.1 | dates.test.ts | [D36.1] due, from and on prefixes resolve when what follows is a date | unit | `due 15 October`; `from 9 Oct`; `on 2026-10-14`; meeting `2026-09-03` | `2026-10-15`, `2026-10-09`, `2026-10-14` |
| TC-69 | D33.1 **(OQ-6)** | dates.test.ts | [D33.1] abbreviation `Sept` is accepted | unit | `by Sept 4`, meeting `2026-09-03` | `date 2026-09-04` **(OQ-6)** |
| TC-71 | D66.1 **(OQ-5)** | dates.test.ts | [D66.1] introducers and relative words are case-insensitive | unit | `BY Friday`, `Due Friday`, `By Tomorrow`, meeting `2026-10-05` | `2026-10-09`, `2026-10-09`, `2026-10-06` |
| TC-64 | D33.1 **(OQ-9)** | dates.test.ts | [D33.1] an ordinal suffix that does not match the number is unresolvable | unit (negative) | `by Oct 2th`, meeting `2026-09-03` | `flagged` |

## Year rollover (D34, D38.1)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected |
|---|---|---|---|---|---|---|
| TC-22 | D34.1 | dates.test.ts | [D34.1] a year-less date more than 6 months before the meeting moves to next year | unit | `2 Mar`, meeting `2026-09-03` | `date 2027-03-02` |
| TC-23 | D34.1 | dates.test.ts | [D34.1] exactly 6 months before is not "more than", so it stays | unit | `3 Mar`, meeting `2026-09-03` | `date 2026-03-03` |
| TC-24 | D34.1 | dates.test.ts | [D34.1] `5 Jan` in a December meeting moves to next year | unit | `5 Jan`, meeting `2026-12-01` | `date 2027-01-05` |
| TC-63 | D34.1 **(OQ-11)** | dates.test.ts | [D34.1] an explicit ISO date before the meeting is stored as written | unit | `by 2026-01-05`, meeting `2026-09-03` | `date 2026-01-05` **(OQ-11)** |
| TC-70 | D33.4 **(OQ-13)** | dates.test.ts | [D33.4] year rollover is applied before the weekday check | unit | `Tue 5 Jan`, meeting `2026-12-01` | `date 2027-01-05`, no warning **(OQ-13)** |

## Not resolved, flagged, or never flagged (D10.3, D33.3, D46.2, D48.2, D48.3, D66.3)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected |
|---|---|---|---|---|---|---|
| TC-25 | D10.3, D48.2 | dates.test.ts | [D10.3] slash date `03/04` is never guessed; flagged when introduced by by | unit (negative) | `by 03/04`, meeting `2026-09-03`; and `03/04` with no introducer | `flagged`; second case `none` |
| TC-26 | D10.3, D48.3 | dates.test.ts | [D48.3] `on 03/04` is plain task text and is never flagged | unit (negative) | `Ship it on 03/04`, meeting `2026-09-03` | `dueFlagged false`, `due null`, text kept |
| TC-27 | D33.3 | dates.test.ts | [D33.3] `by mid-October`, `for November` and `by sometime` are flagged with no date | unit (negative) | each phrase, meeting `2026-09-03` | `flagged` for each |
| TC-28 | D46.2 | dates.test.ts | [D46.2] literal `by <date>` is flagged with no date and kept in the text | unit (negative) | `Owner to remediate finding by <date>` after owner removal, meeting `2026-09-03` | `flagged`; text keeps `by <date>` |
| TC-35 | D48.2 | dates.test.ts | [D48.2] `mid-October` with no introducer is plain text, not flagged | unit | `mid-October review`, meeting `2026-09-03` | `none` |
| TC-36 | D66.3, D8.4 | dates.test.ts | [D66.3] unlisted wording after by is flagged | unit (negative) | `by in 3 days`, `by this week`, `by end of week`, `by tomorrow morning` | `flagged` for each |
| TC-37 | NFR-A7, D8.4 | dates.test.ts | [NFR-A7] `Sam to share the VPN guide` has no date and no flag | unit | text `share the VPN guide` (after owner) | `none`, `dueFlagged false` |
| TC-58 | D8.4 **(OQ-7)** | dates.test.ts | [D8.4] `by today` is unresolvable and flagged | unit (negative) | `by today`, meeting `2026-09-03` | `flagged` **(OQ-7)** |
| TC-65 | D66.2 **(OQ-7)** | dates.test.ts | [D66.2] `by tomorrow EOD` is unresolvable and flagged | unit (negative) | `by tomorrow EOD`, meeting `2026-09-03` | `flagged` **(OQ-7)** |
| TC-66 | D66.3 **(OQ-7)** | dates.test.ts | [D66.3] `by end of the month` (with "the") is unresolvable and flagged | unit (negative) | `by end of the month`, meeting `2026-09-03` | `flagged` **(OQ-7)** |
| TC-67 | D10.3 **(OQ-7)** | dates.test.ts | [D10.3] other numeric date styles are not guessed and flagged | unit (negative) | `by 2026/10/09`, `by 10.10.2026` | `flagged` for each **(OQ-7)** |
| TC-68 | D36.1 **(OQ-7)** | dates.test.ts | [D36.1] `for 4 Mar` is not a due phrase: stays in text, not flagged | unit | `Prep deck for 4 Mar`, meeting `2026-09-03` | `none`, text kept **(OQ-7)** |
| TC-61 | D10.1 **(OQ-10)** | dates.test.ts | [D10.1] an impossible date such as 29 Feb in 2026 is unresolvable | unit (negative) | `by 29 Feb`, meeting `2026-12-01` | `flagged` **(OQ-10)** |
| TC-62 | D10.1 **(OQ-10)** | dates.test.ts | [D10.1] 29 Feb in a leap year resolves | unit | `by 2028-02-29`, meeting `2026-09-03` | `date 2028-02-29` |
| TC-72 | D48.2 **(OQ-20)** | dates.test.ts | [D48.2] `for <month name>` in a task is flagged (known false-positive class) | unit (negative) | `Prep deck for September board`, meeting `2026-09-03` | `flagged` **(OQ-20)** |

## Due phrase selection and text removal (D48, D49)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected |
|---|---|---|---|---|---|---|
| TC-29 | D48.1, D49.1 | dates.test.ts | [D48.1] the last resolving phrase is the due date and `by 10%` stays in the task | unit | `cut cloud costs by 10% — proposal by 2026-10-09`, meeting `2026-09-03` | `due 2026-10-09`, `taskText` still contains `by 10%`, no longer contains `by 2026-10-09` **(OQ-18 for exact string)** |
| TC-30 | D48.2 | dates.test.ts | [D48.2] a `by` phrase that does not resolve, with nothing later that resolves, is flagged | unit (negative) | `cut cloud costs by 10%`, meeting `2026-09-03` | `dueFlagged true`, `due null` |
| TC-31 | D48.1, D48.2 **(OQ-2)** | dates.test.ts | [D48.1] an earlier resolved phrase is kept when a later `by` phrase fails | unit | `review by Friday, due by mid-October`, meeting `2026-09-11` | `due 2026-09-18`, `dueFlagged false` **(OQ-2)** |
| TC-32 | D48.3 | dates.test.ts | [D48.3] `on the demo` and `from Acme` are never flagged | unit | `demo on the demo`, `follow up from Acme`, meeting `2026-09-03` | `none` for both, text kept |
| TC-33 | D49.2 | dates.test.ts | [D49.2] the resolved phrase and its dash are removed from the task | unit | `send revised quote to Acme — by Friday`, meeting `2026-09-11` | `due 2026-09-18`, `taskText` `send revised quote to Acme` |
| TC-34 | D48.1 | dates.test.ts | [D48.1] with two resolving phrases the last one wins | unit | `review by Friday, send by 2026-10-20`, meeting `2026-09-11` | `due 2026-10-20`; `by Friday` stays in the task |

## Robustness and determinism (D8.4, NFR-D2, NFR-D3)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected |
|---|---|---|---|---|---|---|
| TC-38 | D8.4, CLAUDE.md malformed rule | dates.test.ts | [D8.4] arbitrary text never throws; result is one of the three kinds | property | 500 generated strings (fixed seed) with and without introducers | no throw; `due` is null or a valid `YYYY-MM-DD` |
| TC-39 | NFR-D2 | dates.test.ts | [NFR-D2] every returned date is a real calendar date in ISO form | property | generated wordings and meeting dates (fixed seed) | matches `^\d{4}-\d{2}-\d{2}$` and round-trips through the day-number helpers |
| TC-40 | NFR-D3 | dates.test.ts | [NFR-D3] the same inputs give the same output on repeated calls | property | same generated set, twice | identical results |
| TC-47 | D44.1 | dates.test.ts | [D44.1] every item gets exactly one status | property | generated items and todays (fixed seed) | exactly one of `done`, `overdue`, `open` |

## Status and overdue (D1, D44)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected |
|---|---|---|---|---|---|---|
| TC-43 | D1.1 | dates.test.ts | [D1.1] an open item due today is open, not overdue | unit | `open`, due `2026-10-20`, today `2026-10-20` | `open` |
| TC-44 | D1.1 | dates.test.ts | [D1.1] an open item due before today is overdue | unit | `open`, due `2026-10-19`, today `2026-10-20` | `overdue` |
| TC-45 | D1.2, NFR-A7 | dates.test.ts | [D1.2] an item with no due date is never overdue | unit | `open`, due `null`, today `2030-01-01` | `open` |
| TC-46 | D44.1 | dates.test.ts | [D44.1] a done item with a past due date is done, not overdue | unit | `done`, due `2026-01-01`, today `2026-10-20` | `done` |
| TC-49 | D44.1 | dates.test.ts | [D44.1] statusOf does not change the item, so overdue is never stored | unit | any open overdue item | item deep-equal before and after; returned `overdue` |

## CLI dates (D31.6, D38.1, NFR-U3)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected |
|---|---|---|---|---|---|---|
| TC-50 | D38.1 | dates.test.ts | [D38.1] an ISO CLI date is exact, whatever today is | unit | `2026-10-14`, today `2026-11-24` | `2026-10-14` |
| TC-51 | D38.1 | dates.test.ts | [D38.1] `Mar 4` with today 2026-11-24 rolls to 2027-03-04 (cutoff 2026-05-24) | unit | `Mar 4`, today `2026-11-24` | `2027-03-04` |
| TC-52 | D38.1 | dates.test.ts | [D38.1] `Dec 1` with today 2026-11-24 stays in 2026 | unit | `Dec 1`, today `2026-11-24` | `2026-12-01` |
| TC-53 | D31.6 **(OQ-15)** | dates.test.ts | [D31.6] `4 March 2026` is accepted on the CLI | unit | `4 March 2026`, today `2026-11-24` | `2026-03-04` **(OQ-15)** |
| TC-54 | NFR-U3 | dates.test.ts | [NFR-U3] `03/04` on the CLI is an error that lists the valid forms | unit (negative) | `03/04`, today `2026-11-24` | throws an `ActiontrackError` subclass; message names ISO and month-name forms |
| TC-55 | NFR-U3 | dates.test.ts | [NFR-U3] an impossible CLI date is an error | unit (negative) | `2026-02-30`, today `2026-11-24` | throws; message names valid forms |
| TC-56 | NFR-U3 **(OQ-15)** | dates.test.ts | [NFR-U3] a weekday name is not a valid CLI date | unit (negative) | `friday`, today `2026-11-24` | throws **(OQ-15)** |
| TC-57 | D38.1, NFR-U3 **(OQ-10)** | dates.test.ts | [D38.1] `Feb 29` with today 2026-11-24 is an error (no such date in 2026 or 2027) | unit (negative) | `Feb 29`, today `2026-11-24` | throws **(OQ-10)** |

## Integration checks owned by later specs (not in this spec's unit file)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected |
|---|---|---|---|---|---|---|
| TC-73 | D33.4, D70.1 | `tests/unit/commands.test.ts` (spec 06) | [D70.1] a weekday/date warning makes ingest exit 1 | unit | note with `Wed 17 Sep` | exit 1 (owned by spec 06; listed here so the warning contract is tested once) |

## Fixtures needed

No new fixture files are needed for the unit tests. All dates are inline constants.

Calendar reference used in the tables (verify with a scratch script, T38):
- 2026-09-03 Thu; 2026-09-11 Fri; 2026-09-14 Mon; 2026-09-16 Wed; 2026-09-17 Thu; 2026-09-18 Fri; 2026-09-30 Wed
- 2026-10-05 Mon; 2026-10-06 Tue; 2026-10-07 Wed; 2026-10-09 Fri; 2026-10-10 Sat; 2026-10-11 Sun; 2026-10-12 Mon; 2026-10-13 Tue; 2026-10-16 Fri; 2026-10-20 Tue
- 2026-12-01 Tue; 2027-01-05 Tue; 2028-02-29 (leap day)
- Cutoff dates: meeting 2026-09-03 minus 6 months = 2026-03-03; today 2026-11-24 minus 6 months = 2026-05-24; meeting 2026-12-01 minus 6 months = 2026-06-01

Property tests (TC-38, TC-39, TC-40, TC-47) use a seeded generator inside the test file (no external package; CLAUDE.md keeps dependencies minimal).

Acceptance (`tests/acceptance/sample-notes.test.ts`, NFR-A1..A10) is outside this spec. The sample evidence for D47 and D48 must be checked against the real `notes/` folder before those acceptance checks are written (OQ-19).
