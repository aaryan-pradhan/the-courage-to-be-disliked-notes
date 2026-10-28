# The Courage to Be Disliked — Visual Notes

Interactive HTML pages that restate Kishimi & Koga's book as clear, step-by-step logic, one page per book section.

## Language

### Book structure

**Night**:
One of the book's five dialogue sessions (plus the Introduction); a top-level grouping of **Sections**.
_Avoid_: Chapter, part

**Section**:
One titled subsection of a **Night** (~55 in total); the unit of one HTML page.
_Avoid_: Topic, lesson

### Speakers

**Philosopher**:
The Adlerian speaker who asserts and defends the claims.
_Avoid_: Teacher, master

**Youth**:
The skeptical speaker who raises objections.
_Avoid_: Pupil, student

### Formal system

**Definition** (D*n*):
A book-wide numbered statement fixing the meaning of a term (e.g. D2 Etiology).

**Axiom** (A*n*):
A book-wide numbered claim the **Philosopher** asserts without proof; accepted as a starting point.

**Hidden axiom**:
An **Axiom** the book relies on but never states; made explicit so a jump in the book's argument becomes a valid proof.

**Theorem** (T*n*):
A book-wide numbered claim derived from earlier **Definitions**, **Axioms** and **Theorems**.

### Page parts

**Move**:
One step of the dialogue on a page: speaker, one-line plain paraphrase, formal version, and status (objection / refuted / conceded / proved).
_Avoid_: Quote, exchange

**Recall check**:
One question at the end of a **Section** page, with the answer hidden until you reveal it.

## Relationships

- **Definitions**, **Axioms** and **Theorems** are numbered once for the whole book; a **Section** cites them by ID
- A **Theorem** depends only on items introduced in the same or an earlier **Section**
- Every **Theorem** is valid: if its cited premises are true, it is true. Correctness beats faithfulness to the book's wording

- The book has 1 Introduction + 5 **Nights**; each **Night** has ~10 **Sections**
- Each **Section** produces exactly one HTML page: a sequence of **Moves**, one diagram, the resulting **Theorems**, and one **Recall check**

## Flagged ambiguities

- "pupil and student" was used for the two speakers — resolved: they are the **Philosopher** and the **Youth**.
