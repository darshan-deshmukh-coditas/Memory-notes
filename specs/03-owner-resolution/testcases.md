# Test cases: 03 Owner resolution

Unit tests go in `tests/unit/edge-cases.test.ts` (E2 and E3 blocks, which already exist as `it.todo` stubs). Acceptance tests go in `tests/acceptance/` against the sample `notes/` folder (proposed file: `tests/acceptance/owners.acceptance.test.ts`; confirm the folder layout first). Every test name starts with its spec ID in brackets.

Type key: **unit** = pure function test; **acceptance** = sample folder run; **property** = same invariant over a list of hostile inputs. "Negative" marks a case that must NOT produce the obvious result.

Rows marked **(to confirm)** test an open-question default from `plan.md`. They are written now so the default can be checked, but they must not be treated as settled until the user confirms and a D77+ decision is recorded.

Attendee names in unit cases are synthetic. Use the same names only where the spec cites sample notes.

## Owner labels (E2)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result |
|---|---|---|---|---|---|---|
| TC-01 | D25.2 | edge-cases.test.ts (E2) | [D25.2] Someone becomes (no owner) | unit | `Someone to send the deck` | owner `none`; task `send the deck` |
| TC-02 | D25.2 | edge-cases.test.ts (E2) | [D25.2] TBD becomes (no owner) | unit | `TBD to confirm venue` | owner `none`; task `confirm venue` |
| TC-03 | D46.1 | edge-cases.test.ts (E2) | [D46.1] Owner placeholder becomes (no owner) | unit | `Owner to remediate finding` | owner `none` |
| TC-04 | D25.1 | edge-cases.test.ts (E2) | [D25.1] Everyone becomes (group) | unit | `Everyone to read the brief` | owner `group` |
| TC-05 | D25.1 | edge-cases.test.ts (E2) | [D25.1] Team becomes (group) | unit | `Team to sign off` | owner `group` |
| TC-06 | D50.2 | edge-cases.test.ts (E2) | [D50.2] text with no owner pattern is (no owner) with full text | unit | `Review the budget` | owner `none`; task `Review the budget` |
| TC-07 | D50.2, Q9 (to confirm) | edge-cases.test.ts (E2) | [D50.2] empty owner phrase before ` to ` is (no owner) with full text | unit | `to do the thing` | owner `none`; task is full text |
| TC-08 | D67.1 | edge-cases.test.ts (E3) | [D67.1] owner is text before first lower-case ` to ` | unit | `Sam to talk to Priya about X` | owner `Sam`; task `talk to Priya about X` (negative: not split at second `to`) |
| TC-09 | D67.1 | edge-cases.test.ts (E3) | [D67.1] capitalised `To` does not split | unit, negative | `Sam To share the guide` | owner `none`; task is full text |

## Owner name forms (E3)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result |
|---|---|---|---|---|---|---|
| TC-10 | D67.2, D24.2 | edge-cases.test.ts (E3) | [D24.2] @anita: is Anita | unit | `@anita: draft the agenda` | owner `Anita`; task `draft the agenda` |
| TC-11 | D67.2 | edge-cases.test.ts (E3) | [D67.2] @name owner ends at first colon | unit | `@anita: check plan: v2 to be sent` | owner `Anita`; task keeps `plan: v2 to be sent` |
| TC-12 | D24.1 | edge-cases.test.ts (E3) | [D24.1] Priya N. resolves to Priya Nair by surname initial | unit | `Priya N. to send deck`; attendees Priya Nair, Priya Shah | person `Priya Nair` |
| TC-13 | D24.1 | edge-cases.test.ts (E3) | [D24.1] Priya S. resolves to Priya Shah | unit | `Priya S. to send deck`; same attendees | person `Priya Shah` |
| TC-14 | D24.1 | edge-cases.test.ts (E3) | [D24.1] initial matching no attendee is unresolved | unit, negative | `Priya X. to send deck`; same attendees | `unresolved`, text `Priya X.` |
| TC-15 | D24.3 | edge-cases.test.ts (E3) | [D24.3] Anita & Rahul gives one result per person | unit | `Anita & Rahul to book room`; attendees Anita Lee, Rahul Mehta | two results: Anita Lee, Rahul Mehta; both task `book room` |
| TC-16 | D24.3 | edge-cases.test.ts (E3) | [D24.3] each part of a joint owner is resolved on its own | unit | `Anita & Rahul to book room`; attendees Anita Lee, Rahul Mehta, Rahul Verma | Anita Lee; `ambiguous` firstName `Rahul` |
| TC-17 | D24.4 | edge-cases.test.ts (E3) | [D24.4] Lena (with Priya) is owned by Lena and the collaborator stays in task | unit | `Lena (with Priya) to send notes` | owner `Lena`; task text still contains `Priya` |
| TC-18 | D60.2 | edge-cases.test.ts (E3) | [D60.2] `and` does not split owners | unit, negative | `Anita and Rahul to book room` | one `unresolved` result, text `Anita and Rahul` |
| TC-19 | D60.2 | edge-cases.test.ts (E3) | [D60.2] comma list does not split owners | unit, negative | `Anita, Rahul to book room` | one `unresolved` result, text `Anita, Rahul` |

## Attendee and roster resolution (E3)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result |
|---|---|---|---|---|---|---|
| TC-20 | D4.2, NFR-A6 | edge-cases.test.ts (E3) | [D4.2] bare Priya with two Priyas in attendees is (ambiguous) | unit | `Priya to ...`; attendees Priya Nair, Priya Shah | `ambiguous`, firstName `Priya` |
| TC-21 | D4.2, rule 12 | edge-cases.test.ts (E3) | [D4.2] first-name match is case-insensitive | unit | `priya to ...`; same attendees | `ambiguous`, firstName `priya` (typed form kept) |
| TC-22 | D4.1 | edge-cases.test.ts (E3) | [D4.1] single attendee with the first name resolves without roster | unit | `Sam to ...`; attendees Sam Okafor; roster empty | person `Sam Okafor`, `viaRoster` false |
| TC-23 | D4.1, D41 | edge-cases.test.ts (E3) | [D4.1] attendee match wins over a different roster person with the same first name | unit | `Sam to ...`; attendees Sam Okafor; roster also has Sam Vance | person `Sam Okafor`, `viaRoster` false |
| TC-24 | rule 12, Q5 (to confirm) | edge-cases.test.ts (E3) | [rule 12] full name typed in lower case resolves to canonical spelling | unit | `priya nair to ...`; attendee `Priya Nair` | person `Priya Nair` (attendee spelling) |
| TC-25 | D60.1, Q15 (to confirm) | edge-cases.test.ts (E3) | [D60.1] full name not an attendee is accepted from roster | unit | `Sam Vance to ...`; attendees exclude him; roster has Sam Vance | person `Sam Vance`, `viaRoster` true |
| TC-26 | D60.1 | edge-cases.test.ts (E3) | [D60.1] full name neither attendee nor roster is unresolved | unit, negative | `Sam Vance to ...`; roster lacks him | `unresolved`, text `Sam Vance` |
| TC-27 | D41.1 | edge-cases.test.ts (E3) | [D41.1] first name not among attendees resolves by unique roster match | unit | `Sam to ...`; attendees Priya Nair; roster Sam Okafor | person `Sam Okafor`, `viaRoster` true |
| TC-28 | D41.2 | edge-cases.test.ts (E3) | [D41.2] several roster matches give (ambiguous) | unit | `Rahul to ...`; attendees Priya Nair; roster Rahul Mehta, Rahul Verma | `ambiguous`, firstName `Rahul` |
| TC-29 | D41.3 | edge-cases.test.ts (E3) | [D41.3] no roster match gives (unresolved) | unit, negative | `Dana to ...`; attendees Priya Nair; roster has no Dana | `unresolved`, text `Dana` |
| TC-30 | D23.2, NFR-A8 | edge-cases.test.ts (E3) | [D23.2] no attendees: Sam resolves to Sam Okafor via roster | unit | `Sam to ...`; no attendees; roster Sam Okafor | person `Sam Okafor`, `viaRoster` true |
| TC-31 | D23.2, NFR-A8 | edge-cases.test.ts (E3) | [D23.2] no attendees: Rahul stays ambiguous | unit | `Rahul to ...`; no attendees; roster Rahul Mehta, Rahul Verma | `ambiguous`, firstName `Rahul` |
| TC-32 | D23.2 | edge-cases.test.ts (E3) | [D23.2] no attendees and empty roster is unresolved | unit, negative | `Sam to ...`; no attendees; empty roster | `unresolved`, text `Sam` |
| TC-33 | D24.1, Q7b (to confirm) | edge-cases.test.ts (E3) | [D24.1] initial form uses roster when no attendee has the first name | unit | `Priya N. to ...`; no attendees; roster Priya Nair, Priya Shah | person `Priya Nair` |
| TC-34 | D24.1, Q7a (to confirm) | edge-cases.test.ts (E3) | [D24.1] two attendees share first name and initial give (ambiguous) | unit | `Priya N. to ...`; attendees Priya Nair, Priya Nagarajan | `ambiguous`, firstName `Priya` |
| TC-35 | D24.1, Q7c (to confirm) | edge-cases.test.ts (E3) | [D24.1] initial without a dot matches the same as with a dot | unit | `Priya N to ...`; attendees Priya Nair, Priya Shah | person `Priya Nair` |
| TC-36 | Q6 (to confirm) | edge-cases.test.ts (E3) | [D4.1] accent-stripped first name does not match an accented attendee | unit, negative | `Jose to ...`; attendees José Ruiz | `unresolved`, text `Jose` |
| TC-37 | Q6 (to confirm) | edge-cases.test.ts (E3) | [D4.1] hyphen in a first name is part of the name | unit | `Mary-Jane to ...`; attendees Mary-Jane Smith | person `Mary-Jane Smith` |
| TC-38 | D24.3, Q2c (to confirm) | edge-cases.test.ts (E3) | [D24.3] Everyone & Rahul gives a group result and Rahul's result | unit | `Everyone & Rahul to ...`; attendees Rahul Mehta | `group`; person `Rahul Mehta` |
| TC-39 | D24.3, Q2b (to confirm) | edge-cases.test.ts (E3) | [D24.3] Anita & Anita gives one item | unit | `Anita & Anita to ...`; attendees Anita Lee | one result: person `Anita Lee` |
| TC-40 | D67.2, Q8 (to confirm) | edge-cases.test.ts (E3) | [D67.2] @name form is tested before the first ` to ` split | unit | `@anita: talk to Priya`; attendees Anita Lee | person `Anita Lee`; task `talk to Priya` |
| TC-41 | Q8 (to confirm) | edge-cases.test.ts (E3) | [D67.1] @name with no colon is an unresolved phrase, not an @-form | unit | `@anita talk to Priya` | `unresolved`, text `@anita talk` |
| TC-42 | Q9 (to confirm) | edge-cases.test.ts (E3) | [D50.2] a non-name word before ` to ` is (unresolved), not (no owner) | unit, negative | `Schedule to review budget` | `unresolved`, text `Schedule` |
| TC-43 | D25.1, Q4 (to confirm) | edge-cases.test.ts (E2) | [D25.1] placeholder words are case-insensitive | unit | `team to sign off` | owner `group` |

## Owner argument matching (D4.4, D31.3, D42, D72)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result |
|---|---|---|---|---|---|---|
| TC-44 | D4.4, D31.3 | edge-cases.test.ts (E3) | [D4.4] ambiguous first name argument is a usage error listing the choices | unit, negative | `resolveOwnerArg("Priya", ["Priya Nair","Priya Shah"])` | throws usage error; message contains `Priya Nair` and `Priya Shah` |
| TC-45 | D31.3 | edge-cases.test.ts (E3) | [D31.3] full name argument matches case-insensitively | unit | `priya nair`; same list | `Priya Nair` |
| TC-46 | D31.3 | edge-cases.test.ts (E3) | [D31.3] first name matching exactly one person resolves | unit | `Sam`; known `["Sam Okafor"]` | `Sam Okafor` |
| TC-47 | D72.1, Q13 (to confirm) | edge-cases.test.ts (E3) | [D72.1] unknown name is a no-match result, not an error | unit, negative | `Dana`; known `["Sam Okafor"]` | no-match result; no throw |
| TC-48 | D42.1 | edge-cases.test.ts (E2) | [D42.1] none, group, ambiguous, unresolved tokens map to labels | unit | tokens `none`, `group`, `ambiguous`, `unresolved` | labels `(no owner)`, `(group)`, `(ambiguous)`, `(unresolved)` |
| TC-49 | D42.2 | edge-cases.test.ts (E3) | [D42.2] token none selects the label, not an attendee named None (known limitation) | unit, negative | `none`; attendee `None Smith` | label `(no owner)`; no person returned |

## Roster (D61)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result |
|---|---|---|---|---|---|---|
| TC-50 | D61.1 | edge-cases.test.ts (E3) | [D61.1] skipped notes add nothing to the roster | unit, negative | read note attendees Sam Okafor; skipped note attendees Dana Park | roster = {Sam Okafor} |
| TC-51 | D61.2, Q12 (to confirm) | edge-cases.test.ts (E3) | [D61.2] roster merges read-note names and store names, case-insensitively | unit | read notes Sam Okafor; store `sam okafor`, Rahul Mehta | roster has 2 entries; first spelling kept (`Sam Okafor`) |
| TC-52 | D61.2 | edge-cases.test.ts (E3) | [D61.2] no notes and empty store gives empty roster | unit | nothing | empty set |

## Robustness and safety

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result |
|---|---|---|---|---|---|---|
| TC-53 | NFR-SEC4 | edge-cases.test.ts (E3) | [NFR-SEC4] hostile owner text is kept as plain data | unit, negative | `$(rm -rf ~) to x`, `<script>x</script> to y` | `unresolved` with the text verbatim; no exception; no evaluation |
| TC-54 | NFR-R1 | edge-cases.test.ts (E3) | [NFR-R1] resolver never throws on odd input | property | `""`, `"   "`, `" to x"`, `"to x"`, `"@: x"`, `"@"`, `"(with )"`, `"&"`, `"A & to x"` | a result is returned for every input; no throw |

## Acceptance (sample `notes/` folder)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result |
|---|---|---|---|---|---|---|
| TC-55 | NFR-A6, D24.1 | tests/acceptance/owners.acceptance.test.ts | [NFR-A6] 2026-09-29 Priya N. and Priya S. resolve to Priya Nair and Priya Shah | acceptance | sample note `2026-09-29` | `Priya N.` -> Priya Nair; `Priya S.` -> Priya Shah |
| TC-56 | NFR-A6, D4.2 | tests/acceptance/owners.acceptance.test.ts | [NFR-A6] bare Priya and Rahul in named notes are (ambiguous) | acceptance | `2026-09-17`, `2026-10-08`, 2026-09-30 offsite (Priya); `2026-10-07`, offsite (Rahul) | every bare first name item is `(ambiguous)` |
| TC-57 | NFR-A7, D25, D67 | tests/acceptance/owners.acceptance.test.ts | [NFR-A7] Someone, TBD, Everyone, Team labels and Sam owner in sample | acceptance | sample notes; item `Sam to share the VPN guide` | Someone/TBD -> `(no owner)`; Everyone/Team -> `(group)`; Sam -> Sam owner |
| TC-58 | NFR-A8, D23.2 | tests/acceptance/owners.acceptance.test.ts | [NFR-A8] standup with no attendees: Sam resolves, Rahul ambiguous | acceptance | `2026-09-23-standup.md` (roster from all read notes) | Sam -> Sam Okafor (roster); Rahul -> `(ambiguous)` |

## Fixtures needed

Use synthetic names in `tests/fixtures/` for unit cases (no sample names needed):

- **Attendee set A:** Priya Nair, Priya Shah, Anita Lee, Rahul Mehta, Rahul Verma, Sam Okafor (for TC-12 to TC-16, TC-20 to TC-23, TC-44 to TC-47 where relevant).
- **Attendee set B:** Priya Nair, Priya Nagarajan (TC-34 only).
- **Roster set:** Sam Okafor, Sam Vance, Rahul Mehta, Rahul Verma, Priya Nair, Priya Shah.
- **Accented and hyphenated names (to confirm):** José Ruiz, Mary-Jane Smith (TC-36, TC-37).
- **Hostile text strings:** the list in TC-53 and TC-54, inlined in the test file.
- **Acceptance:** the real sample folder `notes/` (read-only, per CLAUDE.md). Do not copy or edit it. Use the spec's note dates as the lookup keys.
- **Negative label fixture:** attendee literally named `None Smith` (TC-49) and the words `Owner`, `TBD`, `team` (TC-02, TC-03, TC-43).
