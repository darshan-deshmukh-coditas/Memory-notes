# actiontrack

A command-line tool that turns team meeting notes into a tracked set of action items and drafts follow-up emails for a person to review. Vocabulary only; behaviour lives in `docs/` and `specs/`.

## Language

### Input

**Note**:
A markdown file for one meeting, with a meeting date, attendees and free text.
_Avoid_: Minutes, document, meeting file

**Meeting date**:
The date of the meeting, taken from the note header. Relative due wording is resolved against it.
_Avoid_: Note date, ingest date

**Attendee**:
A person listed in a note's header, by full name and optionally an email.
_Avoid_: Participant, member

**Roster**:
All full names seen as attendees in the notes that were read, used to resolve a first name when a note's own attendees cannot.
_Avoid_: Directory, contacts

**Skipped note**:
A note excluded as a whole because it is malformed, and reported by file.
_Avoid_: Rejected note, failed note

**Skipped line**:
A checkbox line excluded from an otherwise valid note, and reported by file and line.
_Avoid_: Bad line, error line

**Ignored line**:
A line that looks like an action but is deliberately not one (table row, `ACTION:` line, numbered checkbox, or inside a block quote, code fence or HTML comment). It is counted, not reported as an error.
_Avoid_: Trap line

### Items

**Action item**:
One commitment from a note: an owner, a task, an optional due date, and where it came from.
_Avoid_: Task (that is only the text), todo, ticket

**Task**:
The wording of what must be done, without the owner and without a resolved due phrase.
_Avoid_: Description, title

**Source**:
One place an action item appeared: a note file, its meeting date and the line number.
_Avoid_: Origin, reference

**Duplicate**:
Two action items with the same resolved owner and the same normalised task, from different lines or notes.
_Avoid_: Repeat, copy

**Merged item**:
The single action item that stands for a set of duplicates, keeping every source.
_Avoid_: Combined item, consolidated item

**Flagged item**:
An action item whose due wording could not be resolved, so it has no due date.
_Avoid_: Broken item, invalid item

### Owners

**Owner**:
The person responsible for an action item, stored as a full name or as an owner label.
_Avoid_: Assignee, responsible

**Owner label**:
A stand-in for an owner who is not one resolved person: `(no owner)`, `(group)`, `(ambiguous)` or `(unresolved)`.
_Avoid_: Placeholder owner, special owner

**Ambiguous owner**:
A first name that matches more than one person, so no single owner can be chosen.
_Avoid_: Duplicate name, clash

### Status

**Done**:
The status of an item marked complete, by `done` or by a checked box in a note.
_Avoid_: Closed, complete

**Overdue**:
The status of an item that is not done and whose due date is before today. An item due today is still open.
_Avoid_: Late, expired

**Open**:
The status of an item that is not done and not overdue, including items with no due date.
_Avoid_: Pending, active

### Follow-up

**Follow-up**:
One email draft for one owner, listing that owner's overdue and open items.
_Avoid_: Reminder, chase email

**Draft**:
An email created in Gmail for a person to review and send. The tool never sends.
_Avoid_: Message, outgoing email

**Repeat follow-up**:
A follow-up requested for an owner who already has a draft record, so it is warned about and not created again unless forced.
_Avoid_: Duplicate draft
