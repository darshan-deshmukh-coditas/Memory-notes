# Spec 03: Owner resolution

Decides who an action item belongs to: a full name, or an owner label. This is edge cases E2 (no owner) and E3 (same first name).

| Field | Value |
|---|---|
| Business reqs | BR-09, BR-10 (E2, E3) |
| FRD | FR-I11, FR-I12, FR-E2, FR-E3, D4, D11.3, D16, D23, D24, D25, D41, D42, D46, D50, D60, D61, D67 |
| NFRD | NFR-A6, A7, A8 |
| Modules | `owners/resolve.ts` (`parseOwnerPhrase`, `resolveOwner`, `buildRoster`), types in `domain/types.ts` |
| Tests | `tests/unit/edge-cases.test.ts` (E2, E3) |

## Owner labels (D16, D25, D41, D46)
| Label | Meaning | CLI token |
|---|---|---|
| `(no owner)` | `Someone`, `TBD`, `Owner`, or no owner pattern at all | `none` |
| `(group)` | `Everyone`, `Team` | `group` |
| `(ambiguous)` | a first name that matches more than one person | `ambiguous` |
| `(unresolved)` | a name that matches no one, or a form that is not supported | `unresolved` |

A person literally named `none`, `group`, `ambiguous` or `unresolved` is not supported (D42.2). This is reported as a known limitation.

## Behaviour

### Step 1: read the owner phrase from the line (D24, D50.2, D60.2)
1. `<Name> to <task>`: the owner phrase is the text before the **first ` to `**. `to` is lower case, a word of its own, and case-sensitive (D67.1). `Sam to talk to Priya about X` has owner `Sam`.
2. `@name: <task>`: the owner is the text up to the first colon, matched like any name (D24.2, D67.2).
3. `<Name> N. to ...`: first name plus a surname initial (D24.1).
4. `A & B to ...`: **one item per person** (D24.3). Only `&` splits (D60.2). `A and B to ...` and comma lists are not split: the owner text is stored as `(unresolved)` and reported.
5. `<Name> (with <Other>) to ...`: the owner is `<Name>`. The collaborator stays in the task (D24.4).
6. A line with text but no owner pattern is `(no owner)` with the whole text as the task (D50.2).
7. `Someone`, `TBD`, `Owner` give `(no owner)`. `Everyone`, `Team` give `(group)` (D25, D46.1). Other placeholder words (`All`, `We`, `Everybody`) are not special: they are treated as names and end up `(unresolved)`.

### Step 2: resolve a name against people (D4, D23, D41, D60.1)
8. **A full name** in the item resolves to that person when the full name is among the note's attendees, or is on the roster (D60.1). Otherwise `(unresolved)` and reported.
9. **A first name** is matched against the note's attendees first (D4.1):
    - exactly one attendee has that first name: that person
    - two or more: `(ambiguous)`, reported (D4.2)
    - none: fall back to the roster (rule 11)
10. **A first name plus initial** (`Priya N.`) matches the attendee (or roster person) whose first name matches and whose surname starts with that letter. No match means `(unresolved)`.
11. **Roster fallback** (D23.2, D41): used when the note has no attendees, or the first name is not among them. Exactly one match gives that person and the ingest summary notes the roster match. Several matches give `(ambiguous)`. No match gives `(unresolved)`, reported.
12. First-name matching is case-insensitive. Person identity across notes is the **full name**, compared case-insensitively.

### The roster (D23.1, D61)
13. The roster is the set of full names from attendees of notes that were **read**. Skipped notes contribute nothing (D61.1).
14. It is rebuilt each ingest from the notes read plus the names already in the store (D61.2). The store keeps the roster (see spec 05).

### Ambiguous owners later (D4.4, D31.3, D40.2)
15. `resolveOwnerArg(text, people)` is used by `list --owner` and `followup <owner>`: a full name matches case-insensitively; a first name matching exactly one person matches that person; a first name matching several people is an **error that lists the choices** (exit 2). It never picks one.
16. An `(ambiguous)` item keeps its first name so it can merge with the same first name only (spec 04).

## Acceptance tests
- `D4.2` bare `Priya` with both Priyas in attendees is `(ambiguous)`
- `D24.1` `Priya N.` and `Priya S.` resolve to Priya Nair and Priya Shah (sample 2026-09-29)
- `D23.2` no attendees: `Sam` resolves to Sam Okafor, `Rahul` stays ambiguous (sample 2026-09-23)
- `D41.1`, `D41.3` first name not among attendees: unique roster match, else `(unresolved)`
- `D24.2` `@anita:` is Anita
- `D24.3` `Anita & Rahul to ...` gives two items, each resolved by the attendee rules
- `D24.4` `Lena (with Priya) to ...` is owned by Lena
- `D25`, `D46.1` `Everyone`/`Team` are `(group)`; `Someone`/`TBD`/`Owner` are `(no owner)`
- `D50.2` no owner pattern gives `(no owner)` with the full text
- `D60.1` full name not an attendee: accepted if on the roster, else `(unresolved)`
- `D60.2` `A and B to ...` is not split and is `(unresolved)`
- `D61.1` a skipped note adds nothing to the roster
- `D4.4`, `D31.3` an ambiguous first name argument errors and lists the choices
- `D42` the four `--owner` tokens map to the labels
- `D67.1` owner is the text before the first lower-case ` to `; `Sam to talk to Priya` has owner Sam
- `D67.2` `@anita:` owner is the text up to the first colon
