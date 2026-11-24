# Plan: 03 Owner resolution

## Goal
Decide who each checkbox item belongs to: a full name, or one of four owner labels `(no owner)`, `(group)`, `(ambiguous)`, `(unresolved)`. Covers E2 (no owner) and E3 (same first name). The module is pure: text and lists in, owner result out. No file or store I/O.

## Scope
**In**
- Reading the owner phrase from a checkbox line (spec rules 1 to 7; D24, D50.2, D60.2, D67).
- Resolving a name against note attendees, then the roster (spec rules 8 to 12; D4, D23, D41, D60.1).
- Building the roster from attendee names of notes read, plus names already in the store (`buildRoster`; D61). The resolver takes names only.
- Matching a `--owner` or `followup <owner>` argument (`resolveOwnerArg`; D4.4, D31.3, D42, D72.1 for the contract).
- Mapping the four `--owner` tokens to labels (D42.1).

**Out (owned elsewhere)**
- Note reading, file-level skips, UTF-8 and CRLF handling: spec 01 (D5, D30, D64).
- Checkbox extraction, nested items, table and code-fence traps: spec 01 (D12, D26, D27, D64.3).
- Due-date wording, including the `by <date>` text that the resolver returns untouched: spec 02 (D8 to D10, D33, D34, D36, D46.2, D66).
- Owners file `owners.json` and recipient emails (D56, D18): spec 05 (store) and spec 09 (followup). The resolver never reads emails. D18 is closed by D56.
- Duplicate merge keyed on owner label and firstName (D40, D68): spec 04.
- Persisting the roster and ids: spec 05. Ingest summary lines for roster matches and special labels (D41.1, D16.4), and the email-conflict warning (D56.2): spec 06.
- `list` filters and output (D31, D16.1): spec 07. `followup --all` skip and count, and `followup` usage errors (D16.3, D42.3, D73): spec 09.
- Mapping errors to exit codes: spec 11. The resolver returns results or throws a usage error (CLAUDE.md conventions); `cli/index.ts` maps the exit code.

## Requirement map

| ID | Rule (one line) | Module / function | Tests (TC) |
|---|---|---|---|
| FR-E2, D25.1 | `Everyone`, `Team` give `(group)` | `owners/resolve.ts` `resolveOwner` | TC-04, TC-05, TC-43 |
| FR-E2, D25.2, D46.1 | `Someone`, `TBD`, `Owner` give `(no owner)` | `resolveOwner` | TC-01, TC-02, TC-03 |
| D25.3 | Group and no-owner items are not individually followed up | spec 09 (enforced there) | out of scope here |
| D50.2 | Text with no owner pattern gives `(no owner)` and the full text | `parseOwnerPhrase` | TC-06, TC-07, TC-09 |
| D67.1 | Owner is text before the first lower-case ` to ` | `parseOwnerPhrase` | TC-08, TC-09 |
| D67.2 | `@name:` owner is text up to the first colon | `parseOwnerPhrase` | TC-10, TC-11 |
| D24.1 | `Priya N.` matches by surname initial | `resolveOwner` | TC-12, TC-13, TC-14, TC-33, TC-34, TC-35, TC-55 |
| D24.2 | `@anita:` is Anita | `parseOwnerPhrase` | TC-10, TC-40 |
| D24.3 | `A & B` gives one result per person | `parseOwnerPhrase`, `resolveOwner` | TC-15, TC-16, TC-38, TC-39 |
| D24.4 | `Lena (with Priya)` is Lena; collaborator stays in task | `parseOwnerPhrase` | TC-17 |
| D60.2 | Only `&` splits; `and` and commas do not | `parseOwnerPhrase` | TC-18, TC-19 |
| FR-E3, D4.1 | First name checked against attendees first | `resolveOwner` | TC-22, TC-23 |
| D4.2, NFR-A6 | Two attendees share a first name gives `(ambiguous)` | `resolveOwner` | TC-20, TC-21, TC-56 |
| D41.1 | First name not in attendees: unique roster match, flagged `viaRoster` | `resolveOwner` | TC-27 |
| D41.2 | Several roster matches give `(ambiguous)` | `resolveOwner` | TC-28 |
| D41.3 | No roster match gives `(unresolved)` | `resolveOwner` | TC-29 |
| D23.2, NFR-A8 | No attendees: unique roster match resolves, several stay ambiguous | `resolveOwner` | TC-30, TC-31, TC-32, TC-58 |
| D60.1 | Full name not an attendee: accepted if on roster, else `(unresolved)` | `resolveOwner` | TC-25, TC-26 |
| D61.1 | Skipped notes add nothing to the roster | `buildRoster` | TC-50 |
| D61.2 | Roster = read notes plus store names | `buildRoster` | TC-51, TC-52 |
| D4.4, D31.3 | Ambiguous first name arg is a usage error listing choices | `resolveOwnerArg` | TC-44, TC-45, TC-46 |
| D72.1 | Unknown name arg is not an error | `resolveOwnerArg` | TC-47 |
| D42.1 | Four tokens map to labels | `resolveOwnerArg` | TC-48 |
| D42.2 | Literal person named `none` etc. is a known limitation | `resolveOwnerArg` | TC-49 |
| D67, NFR-A7 | Sample `Sam to share the VPN guide` gives owner Sam | `parseOwnerPhrase` | TC-57 |
| NFR-SEC4 | Note text is data, never evaluated | `owners/resolve.ts` (pure string ops) | TC-53 |
| NFR-R1 | No input throws out of the resolver | `owners/resolve.ts` | TC-54 |
| NFR-M1 | Resolver testable alone | module structure | all unit TCs |

## Design approach
- **Two-stage pure pipeline.** `parseOwnerPhrase(text)` splits a line into owner phrase, task and an owner shape (`placeholder`, `group`, `at-form`, `name`, `joint`, `none`). `resolveOwner(phrase, attendees, roster)` maps each phrase part to an `OwnerResolution`. Both are pure. The existing stub signature `resolveOwner(itemText, attendees, roster)` can stay as a wrapper.
- **Precedence, in order.** (1) Placeholder words (`Someone`, `TBD`, `Owner`, `Everyone`, `Team`) by exact phrase. (2) `@name:` form. (3) First ` to ` split. (4) `&` split into parts. (5) Strip a trailing `(with ...)` from each part. (6) Resolve each part: full name (attendees, then roster), `First N.` initial, bare first name (attendees, then roster). Any miss gives `(unresolved)`.
- **Attendees before roster.** The roster is consulted only when no attendee has the first name (D41). A first name that matches two or more attendees is `(ambiguous)` and never checks the roster.
- **Comparison.** Names compare case-insensitively (spec rule 12). Output uses the spelling from attendees or roster, not the typed form (Q5).
- **Result shape.** `OwnerResolution` keeps `person` (with `viaRoster`), `none`, `group`, `ambiguous` (first name), `unresolved` (raw text). The `&` case returns one result per part, so the caller creates one item per result (Q2).
- **Errors.** No input throws. Unexpected states fall to `(unresolved)` with the raw text. Only `resolveOwnerArg` throws, for an ambiguous first name, as a usage error (exit 2 via the CLI).
- **Naming.** The spec names are `parseOwnerPhrase`, `resolveOwner`, `buildRoster` and `resolveOwnerArg`. The stub names `matchOwnerArg` and the missing `parseOwnerPhrase` and `buildRoster` do not match (Q1).

## Error and flag handling
- `(unresolved)`, `(ambiguous)` and `viaRoster` results are returned as data. Spec 06 turns them into the ingest summary and warnings (D16.4, D41.1).
- A malformed owner phrase is never a file-level skip. It becomes an item with an owner label (D50.2, D5.2 is not triggered here).
- An empty checkbox text is skipped in spec 01 (D50.1), before this module runs.

## Dependencies on other specs
- **Consumes from spec 01:** the raw item text (checkbox removed) and the note's attendees as `Attendee[]` (`domain/types.ts`).
- **Consumes from spec 05:** the store names that feed `buildRoster` (D61.2). The store persists the roster.
- **Produces for spec 04:** owner label or full name, plus the normalised first name for `(ambiguous)` (D40.2, D68.1 need the raw unresolved text, see Q3).
- **Produces for spec 06:** `viaRoster` flags and the list of `(unresolved)`/`(ambiguous)` items for the summary.
- **Produces for spec 07 and 09:** `resolveOwnerArg` for `list --owner` and `followup <owner>`; label values for `--owner` tokens and the `followup --all` skip (D16.3, D42.3).

## Risks
- **Spec and stub drift.** The stub names and `firstName` field do not match the spec. Fix before writing red tests, or the tests will target the wrong names.
- **Sample coverage.** NFR-A6 to A8 depend on spec 01 and spec 06 (roster built from all read notes). Their acceptance tests stay red until those specs land.
- **Phrase forms.** Real-world line shapes follow the Q8 to Q10 decisions. Check the acceptance run output for the sample folder against them.
- **Name collisions with labels.** A person named `None` or `Team` cannot be selected (D42.2). Accepted as a known limitation.

## Decisions
Each decision is settled. Task references in `task.md` point here as "per decision Qn".

- **Q1.** Spec names are authoritative: `resolveOwner`, `parseOwnerPhrase`, `buildRoster`, `resolveOwnerArg`. The stub `matchOwnerArg` is renamed and the missing stubs are added (task T01).
- **Q2.** One owner text naming two people (`Anita & Rahul`) returns a list with one result per person (D24.3). `resolveOwner` returns an array.
- **Q2b.** `Anita & Anita` gives one result.
- **Q2c.** `Everyone & Rahul` gives a group result plus Rahul's result.
- **Q3.** `(unresolved)` carries `text`, the raw owner text, not `firstName` (D68.1).
- **Q4.** Placeholder words match case-insensitively, with a trailing `.`, `,` or `:` stripped (D66.1 precedent).
- **Q5.** Output uses the spelling from attendees or the roster, not the typed form.
- **Q6.** Names match exactly after case folding. No accent folding (`Jose` does not match `José`). Hyphen and apostrophe are name characters.
- **Q7a.** Two attendees with the same first name and surname initial give `(ambiguous)`.
- **Q7b.** If no attendee has the first name, the roster is used for the `First N.` form (rule 10).
- **Q7c.** The dot is optional: `Priya N` and `Priya N.` both match the attendee whose surname starts with N. Several matches give `(ambiguous)`.
- **Q8.** `' to '` splits owner from task only when the word before it is a known owner or roster name; otherwise the whole text is the task. `@name:` is tested first, so `@anita: talk to Priya` has owner Anita. `@anita talk` with no colon is an unresolved owner phrase `@anita talk`.
- **Q9.** Only a known owner word before `' to '` counts as an owner. Any other text before it stays in the task, so `Schedule to review budget` gives `(no owner)` with the full text. An empty word before `' to '` (`to do x`) also gives `(no owner)` with the full text.
- **Q10.** A trailing `(with X)` is stripped from each `&` part; the collaborator stays in the task text (D24.4).
- **Q11.** A full name with a wrong surname (`Priya Sharma` when only `Priya Shah` is an attendee) gives `(unresolved)`. There is no fallback to the first name.
- **Q12.** Roster names compare case-insensitively; the first spelling seen wins (store names first, then notes in read order). Email handling stays in spec 05.
- **Q13.** `resolveOwnerArg` returns a discriminated result: `person`, `label` or `no-match`. An ambiguous first name throws a usage error. `knownOwners` is roster names plus store names. `followup <unknown>` follows the same `no-match` result (spec 09).
- **Q14.** A person literally named `none` gives a warning and keeps the `(no owner)` label (D42.2). The warning is returned as data for spec 06 to print.
- **Q15.** A full name matched on the roster sets `viaRoster: true`, so the ingest summary notes it as for D41.1.
- **Q16.** `@Anita:` matches Anita; the `@` form compares case-insensitively.

**Settled earlier (do not re-ask):** owners file location and format (D56); roster source (D61); roster fallback when the note has attendees but not the first name (D41); full name not attendee (D60.1); joint owner split (D60.2); owner phrase boundary (D67). Spec 03 items for D23 and D11.3 are closed by D41, D61 and D60.
