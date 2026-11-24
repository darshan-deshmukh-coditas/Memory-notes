# Test cases: spec 11, CLI conventions

Every test name starts with its TC ID in brackets, then the spec ID, so the test is traceable to both. All cases go in `tests/unit/commands.test.ts`, in a `describe("CLI conventions (spec 11)")` block.

Types:
- **in-process**: calls `run(argv, fakeDeps)` from `src/cli/index.ts` with the fake `Deps` (T04). No real network, no Gmail.
- **process**: spawns `node --import tsx src/cli/index.ts` in a temp working directory (T05). Real exit code and real streams.
- **static**: reads source files and asserts a rule holds across the repo.
- **CI**: runs on the CI matrix (T43), not in the local suite.

"Negative" marks a case that expects a refusal, an error, or an exit of 2 or more.

Common setup unless stated: temp working directory, store at `<tmp>/.actiontrack/items.json`, notes folder `tests/fixtures/cli-conventions/`, `clock = fixedClock("2026-10-20")`, fake connector that records calls.

## Cases

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input (argv, env) | Expected (stdout / stderr / exit) |
|---|---|---|---|---|---|---|
| TC-01 | NFR-U1 | commands.test.ts | `[TC-01] NFR-U1: root help lists the four commands` | process | `--help` | stdout names `ingest`, `list`, `done`, `followup`; exit 0 |
| TC-02 | NFR-U1 | commands.test.ts | `[TC-02] NFR-U1: each command name is recognised` | in-process | `ingest --help`, `list --help`, `done --help`, `followup --help` | each prints its help; exit 0; no "unknown command" on stderr |
| TC-03 | NFR-U2 | commands.test.ts | `[TC-03] NFR-U2: list accepts --owner, --status, --due-before` | in-process | `list --owner Priya --status open --due-before 2026-10-25` | no option error; exit 0 |
| TC-04 | NFR-U3 | commands.test.ts | `[TC-04] NFR-U3: invalid --status lists valid values` (negative) | in-process | `list --status later` | stderr names `open`, `done`, `overdue`; stdout empty; exit 2 |
| TC-05 | NFR-U3, D54.1 | commands.test.ts | `[TC-05] NFR-U3: invalid --due-before says the valid forms` (negative) | in-process | `list --due-before sometime` | stderr gives ISO and `Mar 4` forms; exit 2 |
| TC-06 | NFR-U3, D270 | commands.test.ts | `[TC-06] NFR-U3 D270: unknown command, unknown flag and bad done id exit 2` (negative) | process | (a) `sync`; (b) `list --bogus`; (c) `done abc` | each: stderr names the problem; exit 2 (not commander's default 1) |
| TC-07 | NFR-U4 | commands.test.ts | `[TC-07] NFR-U4: program --help describes the tool and global options` | process | `--help` | stdout has description "Never sends email" and `--store`, `--today` wording; exit 0 |
| TC-08 | NFR-U4, D17.2, D54.1 | commands.test.ts | `[TC-08] NFR-U4: each command --help shows --store and --today` (it.each over 4 commands; `followup` also shows `--all`, `--force`) | process | `<cmd> --help` | stdout contains `--store <path>` and `--today <date>`; exit 0 |
| TC-09 | NFR-U5, D15.5 | commands.test.ts | `[TC-09] NFR-U5: list default is a readable table, --json is valid JSON` | in-process | (a) `list`; (b) `list --json` with store from fixtures | (a) stdout has header row and aligned columns; (b) `JSON.parse(stdout)` is an array; exit 0 |
| TC-10 | NFR-U6, D30.1 | commands.test.ts | `[TC-10] NFR-U6: ingest prints skip report and totals` | in-process | `ingest <fixtures>` | stderr has "Skipped notes" section naming the empty file; stdout has totals; exit 1 |
| TC-11 | D54.1 | commands.test.ts | `[TC-11] D54.1: --today is accepted by all four commands` (it.each) | in-process | `ingest <fixtures> --today 2026-10-20`; `list --today 2026-10-20`; `done 1 --today 2026-10-20`; `followup --all --today 2026-10-20` | no option error; exit is 0, 1, 2 (for missing item or no connector) but never "unknown option" |
| TC-12 | D54.1 | commands.test.ts | `[TC-12] D54.1: --today in US format is rejected` (negative) | in-process | `list --today 03/04/2026` | stderr shows `YYYY-MM-DD`; exit 2; store file not created |
| TC-13 | D54.1 | commands.test.ts | `[TC-13] D54.1: --today as month name is rejected` (negative) | in-process | `list --today "Mar 4"` | stderr shows ISO format; exit 2 |
| TC-14 | D54.1, D271 | commands.test.ts | `[TC-14] D54.1 D271: --today 2026-02-30 is rejected` (negative) | in-process | `list --today 2026-02-30` | stderr shows valid format; exit 2 |
| TC-15 | D17.2 | commands.test.ts | `[TC-15] D17.2: --store sets the store path for each command` (it.each: ingest, list, done, followup) | in-process | `<cmd> ... --store <tmp>/custom/items.json` | file exists at that path; default path not created; exit per command |
| TC-16 | D17.2 | commands.test.ts | `[TC-16] D17.2: ACTIONTRACK_STORE sets the store path when --store is absent` | in-process | `ingest <fixtures>`; env `ACTIONTRACK_STORE=<tmp>/env/items.json` | file exists at env path; exit 1 |
| TC-17 | D17.2, D264 | commands.test.ts | `[TC-17] D17.2 D264: --store wins over ACTIONTRACK_STORE` (negative for env) | in-process | `ingest <fixtures> --store <tmp>/flag.json`; env `ACTIONTRACK_STORE=<tmp>/env.json` | `flag.json` exists; `env.json` does not |
| TC-18 | D59.1 | commands.test.ts | `[TC-18] D59.1: default store is per working directory` | process | `ingest <fixtures>` in dir A, then `list` in dir B | dir B list prints `No items match.`; exit 0; dir A store untouched |
| TC-19 | D20.1, D31.5, D59.3 | commands.test.ts | `[TC-19] D20.1: success with no matches exits 0` | process | `list` with no store present | stdout `No items match.`; stderr empty; exit 0 |
| TC-20 | D20.2, D70.1 | commands.test.ts | `[TC-20] D20.2: ingest with one skipped note exits 1 and stores the rest` | in-process | `ingest <fixtures>` (contains empty note) | exit 1; other notes' items stored; skip reason on stderr |
| TC-21 | D20.3, D35.3 | commands.test.ts | `[TC-21] D20.3: missing folder and folder with no notes exit 2` (negative, it.each two cases) | in-process | `ingest <tmp>/nope`; `ingest <empty tmp dir>` | stderr names the folder or says `No notes found`; exit 2; store not created |
| TC-22 | D20.4, D20.5, NFR-R4 | commands.test.ts | `[TC-22] D20.4: Gmail failure exits 3, store unchanged` (negative) | in-process | `followup Priya`; fake connector throws `GmailError` | stderr clear error; stdout no draft line; store bytes identical before and after; exit 3 |
| TC-23 | D53.1, D53.2 | commands.test.ts | `[TC-23] D53.1: highest exit code wins (3 over 1)` | in-process | `followup --all`; one owner has no recipient (warning), another's draft fails (GmailError) | exit 3; stderr has both the no-recipient warning and the failure |
| TC-24 | D62.1 | commands.test.ts | `[TC-24] D62.1: unexpected internal error exits 4 with clear stderr` (negative) | in-process | `list`; fake store read throws plain `Error("boom")` | stderr `unexpected error: boom`; stdout empty; exit 4 |
| TC-25 | D62.1, D59.2 | commands.test.ts | `[TC-25] D62.1: I/O failure during save exits 4 and leaves store as it was` (negative) | in-process | `done 1`; fake write throws `Error("ENOSPC")` | exit 4; store file bytes identical to before; stderr names the failure |
| TC-26 | D62.2, D53.1 | commands.test.ts | `[TC-26] D62.2: 4 beats 3, 2 and 1` | in-process | unit on `highestExit([3, 2, 1, 4])`; integration: `followup --all` where a Gmail failure (3) is followed by an internal error | unit returns 4; integration exit 4 |
| TC-27 | NFR-O3 | commands.test.ts | `[TC-27] NFR-O3: warnings go to stderr, results to stdout` | in-process | `ingest <fixtures>` with a skipped note | stdout has totals and no "Skipped"; stderr has "Skipped"; exit 1 |
| TC-28 | NFR-O3, D15.5 | commands.test.ts | `[TC-28] NFR-O3: with --json, stdout is only the JSON document` | in-process | `list --json` with a store that produces a warning (fixture store with one malformed row, if spec 05 defines it; otherwise any warning source) | `JSON.parse(stdout)` succeeds; any warning text is on stderr only |
| TC-29 | N4, NFR-O3 | commands.test.ts | `[TC-29] N4: no log file is created by any command, including failures` | process | run `ingest` (with skip), `list`, `done 1`, `followup` with no MCP cmd, `list --bogus`; then list the temp dir | no `*.log` or other new file beyond `.actiontrack/items.json`; notes folder bytes unchanged |
| TC-30 | D30.3, D70.1 | commands.test.ts | `[TC-30] D30.3: skipped notes make ingest exit 1, each listed on stderr` | in-process | `ingest <fixtures>` | exit 1; stderr lists each skipped file name with its reason; stdout has the count |
| TC-31 | D65.1 | commands.test.ts | `[TC-31] D65.1: skip reason strings are exact` (it.each: `empty file`, `not valid UTF-8`, `missing date`, `unparseable date`, `empty action item`) | in-process | `ingest` on fixture folder with one case per reason | stderr contains the exact string for each reason |
| TC-32 | NFR-M2 | commands.test.ts | `[TC-32] NFR-M2: a fixed --today gives repeatable output` | in-process | `list --today 2026-10-20` run twice on same store | both stdout strings identical |
| TC-33 | NFR-M2, D1.3, D1.1 | commands.test.ts | `[TC-33] NFR-M2: changing --today changes overdue, not the stored data` | in-process | item due `2026-10-19`; `list --status overdue --today 2026-10-19` then `--today 2026-10-20` | first run: item not listed; second run: listed as overdue; store file bytes unchanged |
| TC-34 | D1.3 | commands.test.ts | `[TC-34] D1.3: without --today, today is the system local date` | in-process | `systemClock.today()` with fake timers set to local 2026-10-20 00:30 | returns `2026-10-20` |
| TC-35 | NFR-C1, N3 | commands.test.ts | `[TC-35] NFR-C1: store and notes paths containing a space work` | process | `ingest "<tmp>/my notes"` with `--store "<tmp>/my store/items.json"` | exit 0 or 1 per fixture; store created inside `my store` |
| TC-36 | NFR-C1, N3 | CI config | `[TC-36] NFR-C1: npm run check passes on windows-latest, macos-latest, ubuntu-latest` | CI | CI matrix (T43) | all three jobs green; if no CI, recorded as a manual step on Windows, macOS and Linux |
| TC-37 | NFR-O1 | commands.test.ts | `[TC-37] NFR-O1: each command prints a result line on success` (it.each: ingest, list, done, followup) | in-process | one success case per command | stdout has a summary (counts, id or draft id); exit 0 or 1 |
| TC-38 | D55.1, D55.2 | commands.test.ts | `[TC-38] D55: CRLF and LF notes give the same items` | in-process | `ingest` on folder with the CRLF fixture and an LF copy | same task text and owner for both; BOM-free handling; no skip for either |
| TC-39 | NFR-C4, D1.3, D276 | commands.test.ts | `[TC-39] NFR-C4: local midnight is the day boundary` | in-process | fake timers local 2026-10-19 23:59 then 2026-10-20 00:00; `systemClock.today()` each time | `2026-10-19`, then `2026-10-20` |
| TC-40 | spec 11 item 6, D272, D62.1 | commands.test.ts | `[TC-40] spec 11 item 6: exit codes and console output only in cli/index.ts` | static | grep `src/**/*.ts` for `process.exitCode`, `process.exit(`, `console.`, `.exitCode`, `NotImplementedError` | matches only in `src/cli/index.ts` (and `domain/errors.ts` for class definitions); `NotImplementedError` gone after T28 |
| TC-41 | spec 11 item 8, NFR-M2 | commands.test.ts | `[TC-41] spec 11 item 8: only clock.ts reads the system date` | static | grep `src/**/*.ts` for `new Date(` and `Date.now(` | matches only in `src/clock.ts` |
| TC-42 | spec 11 item 4 | commands.test.ts | `[TC-42] spec 11 item 4: only the two documented env vars are read` | static | grep `src/**/*.ts` for `process.env` and `deps.env` reads | only `ACTIONTRACK_STORE` and `ACTIONTRACK_GMAIL_MCP_CMD` appear as keys |
| TC-43 | D265, D17.2 | commands.test.ts | `[TC-43] D265: empty ACTIONTRACK_STORE is treated as unset` | in-process | `ingest <fixtures>`; env `ACTIONTRACK_STORE=""` | default `<cwd>/.actiontrack/items.json` created |
| TC-44 | D266 | commands.test.ts | `[TC-44] D266: relative --store path resolves from the working directory` | process | `ingest <fixtures> --store sub/items.json` in temp cwd | `<cwd>/sub/items.json` exists |
| TC-45 | D267, D71.3 | commands.test.ts | `[TC-45] D267: list --json with no match prints [] on stdout only` | in-process | `list --json` on empty store | stdout `[]`; stderr empty; exit 0 |
| TC-46 | D268, NFR-U3 | commands.test.ts | `[TC-46] D268: --version is not supported` (negative) | process | `--version`; `-V` | both: stderr "unknown option"; exit 2 |
| TC-47 | D269, D20.3 | commands.test.ts | `[TC-47] D269: no command prints help and exits 2` (negative) | process | no arguments | stdout shows the four commands; exit 2 |
| TC-48 | D272 | commands.test.ts | `[TC-48] D272: a command refusal is thrown, not returned as a code` | in-process | `done 999` on store with 2 items | promise rejects with `ActiontrackError` whose `exitCode` is 2 |
| TC-49 | spec 11 item 6, D272 | commands.test.ts | `[TC-49] spec 11 item 6: a thrown ActiontrackError maps to its exit code in run()` | in-process | fake command throws `UsageError("x")` | stderr `error: x`; stdout empty; exit 2 |
| TC-50 | D273, spec 09 items 1-2 | commands.test.ts | `[TC-50] D273: followup needs exactly one of <owner> or --all` (negative, it.each: neither; both) | in-process | `followup`; `followup Priya --all` | stderr names the two valid forms; exit 2; no draft created |
| TC-51 | D274, spec 11 item 4 | commands.test.ts | `[TC-51] D274: followup without ACTIONTRACK_GMAIL_MCP_CMD exits 2` (negative) | in-process | `followup Priya`; env without `ACTIONTRACK_GMAIL_MCP_CMD` | stderr names the variable; store unchanged; exit 2 |
| TC-52 | D275 | commands.test.ts | `[TC-52] D275: EPIPE on stdout exits 0 silently` | in-process | `list`; fake `out` throws error with `code: "EPIPE"` | stderr empty; exit 0 |
| TC-53 | D277, D65.2 | commands.test.ts | `[TC-53] D277: list table shows full task text without truncation` | in-process | store with one item whose task is 150 characters | the full 150 characters appear in stdout; no colour codes |
| TC-54 | D278, D15.3, NFR-A9 | commands.test.ts | `[TC-54] D278: equal due dates sort by ascending id, repeatably` | in-process | store with three items due the same day, ids 3, 1, 2; `list` twice | rows in order 1, 2, 3 both runs |
| TC-55 | D279, D59.1, D17.1 | commands.test.ts | `[TC-55] D279: default store is <cwd>/.actiontrack/items.json` | process | `ingest <fixtures>` with no store option or env | file exists at `<cwd>/.actiontrack/items.json` |

## Fixtures needed

Under `tests/fixtures/cli-conventions/` (T06). Each file is synthetic and tiny.

| File | Purpose | Used by |
|---|---|---|
| `2026-10-01-ok.md` | valid note: date header, two checkbox items, one with a due date | TC-10, TC-11, TC-15, TC-16, TC-17, TC-32, TC-37, TC-54 |
| `2026-10-02-empty.md` | zero bytes; skip reason `empty file` | TC-10, TC-20, TC-27, TC-30, TC-31 |
| `2026-10-03-crlf.md` | CRLF line endings, same items as the LF copy | TC-38 |
| `2026-10-04-nodate.md` | no date header; skip reason `missing date` | TC-31 |
| `2026-10-05-baddate.md` | `Date: sometime last week`; skip reason `unparseable date` | TC-31 |
| `2026-10-06-binary.md` | bytes that fail UTF-8 decoding; skip reason `not valid UTF-8` | TC-31 |
| `2026-10-07-blank-item.md` | valid header and a checkbox line with empty text; skip reason `empty action item` | TC-31 |
| `2026-10-19-overdue.md` | item due `2026-10-19` for the overdue checks | TC-33 |
| `store-v1-one-open.json` | version 1 store with one open item (id 1, task 150 characters for TC-53) | TC-09, TC-33, TC-45, TC-53 |
| `store-v1-three-same-due.json` | version 1 store with three items due the same day, ids 3, 1, 2 | TC-54 |
| `store-corrupt.json` | invalid JSON; used to check exit 2 path for store errors (spec 05) | TC-29 (optional), spec 05 tests |

Notes on fixtures:
- Store fixtures must follow spec 05's version 1 shape. If spec 05 changes it, update these files first.
- Binary and CRLF fixtures are written by the test helper where git would otherwise normalise them (`.gitattributes` to be checked; if absent, record as a risk in `plan.md`).
- TC-28 needs a warning source. If spec 05 does not define a malformed-row warning, use a store that causes a warning on `list`, or mark TC-28 as "pending spec 05" and keep the stdout-only assertion on `list --json` alone.

## Coverage summary

- Acceptance bullets in `spec.md` (`NFR-U1`, `NFR-U2`, `NFR-U4`, `D54.1`, `D17.2`, `NFR-O3`, `D20`/`D53.1`, `NFR-M2`, `NFR-C1`): TC-01, TC-03, TC-07, TC-11, TC-15 to TC-17, TC-27, TC-19 to TC-23, TC-26, TC-32 to TC-33, TC-35, TC-36.
- Negative cases: TC-04, TC-05, TC-06, TC-12 to TC-14, TC-21, TC-22, TC-24, TC-25, TC-46, TC-47, TC-50, TC-51.
- Open-point decisions: D264 (TC-17), D265 (TC-43), D266 (TC-44), D267 (TC-28, TC-45), D268 (TC-46), D269 (TC-47), D270 (TC-06), D271 (TC-14), D272 (TC-40, TC-48, TC-49), D273 (TC-50), D274 (TC-51), D275 (TC-52), D276 (TC-39), D277 (TC-53), D278 (TC-54), D279 (TC-55).
- Structural rules: exit codes only in `cli/index.ts` (TC-40), no log file (TC-29), single clock (TC-41), env vars (TC-42).
