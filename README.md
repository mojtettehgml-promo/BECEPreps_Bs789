# BECE Prep Zone — v1.2.1 (Cloudflare)
A child-friendly BECE revision app: **Integrated Science, Mathematics, Ghanaian Language (Ga) and Computing**, for **Basic 7, 8 and 9**. It starts empty; you add the topics.

## v1.3.0 — built-in Basic 7 Integrated Science lessons
- 285 ready-made lessons (20 topics: Strands 1–5) ship inside the app (`src/seed/`). They are only readable by the signed-in admin.
- Admin → Settings & backup → **Add the built-in lessons** adds only lessons that are missing. Lessons you edited are never changed; lessons you deleted are not brought back unless you tap *Bring back the ones I deleted*.
- Lessons are normal lessons afterwards: edit, unpublish, delete or add your own.
- Reading many lessons now takes one database query (D1 allows only a limited number of queries per request).
- Rebuild the seed from the Word books with `python3 tools/strands/make_seed.py`.

## Deploy
Same steps as the Trainer: GitHub repo → create D1 database `bece-prep-zone` and paste its ID into `wrangler.jsonc` → Workers Builds import (deploy command `npx wrangler deploy`) → add secrets `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `PASSWORD_VAULT_KEY`. Use the Workers **Paid** plan (sign-in hashing needs more than the Free 10 ms CPU).


## What is new in v1.2
- **Every mini-lesson has its own Quick check.** It draws 5 multiple-choice questions and 1 structured question at random from that lesson's questions, and shuffles the answer order. "Try again" gives a different set.
- **Topic test draws from the whole topic.** 8 multiple-choice and 3 structured questions, picked at random from every lesson in the topic. Question bank and Subject challenge use the same pool.
- **Word importer reads the "Explore / Connect / Try This" layout.** Lesson header tables become lesson titles, "Try This" questions become draft questions for that lesson (not notes), and "Show and Share" class-discussion prompts are left out.
- Topics are listed in order (1.1, 1.2, ...).
- **v1.2.1: livelier banner.** Layered colour, floating subject icons (science, maths, Ga, computing), a rainbow edge, coloured topic headers and lesson icons. Tables now fit on a phone without sideways scrolling.

### Loading Basic 7 Strand 1
Settings & backup, Restore lessons from a backup, choose `basic7-strand1-v1.2.json` (1.1 Materials and 1.2 Living Cells).

## What is new in v1.1
- **Basic 7 / 8 / 9.** Learners choose their class at sign-up (and can change it under Me). Each lesson belongs to a class.
- **Computing** is the fourth subject.
- **Short mini-lessons.** A topic (for example "1.1 Materials") is a path of short lessons of a few colourful cards each, ending with a **Topic test**.
- **Questions are multiple choice and structured only.** Fill-in questions are no longer offered.
- **Structured questions are typed and scored by ideas.** For each part you list the key ideas and, for each idea, the key words (different ways of saying it). A learner earns a mark for every idea found in what they typed. Wording does not have to match the notes. A missed idea shows a button "I said this in my own words", so a child is never penalised for a good answer with different words.
- **Pictures.** Upload pictures in the lesson editor (🖼 Add a picture). Word chapter files that contain pictures bring them in automatically. A line `[[pic: description]]` in a card shows a picture slot to fill later. Teachers see the slot, learners do not.
- **Textbook importer.** Lessons tab → *Import a textbook chapter (Word)*. Each chapter file becomes a topic of mini-lessons, plus Quick recap, Word bank and a drafted Topic test. File names like `B7_1.1_Materials.docx` set the class and topic. Multiple-choice questions are imported only when the file has an answer key ("Teacher Answer Key"). True/false questions and creative tasks ("design a poster") are left out.
- Everything imported is a **draft**. Add the key ideas and key words to each structured question, then Save & publish.

### Loading the Basic 7 Materials pilot
Settings & backup → **Restore lessons from a backup** → choose `basic7-1.1-materials.json`. It adds the topic with its pictures and a ready Topic test.

## Adding topics (teacher)
Sign in with the admin details → **Lessons** → choose the subject → upload one or more **Word (.docx) or PDF** files.
- Each file becomes a **draft lesson**, split automatically into about 2–3 reading pages (headings become page titles). Very long files get more pages.
- Everything under a heading called *Questions / Exercises / Quiz / Test yourself* is read as test questions (format below).
- Fill-in questions are drafted from **bold** key terms in your text. You review them: keep only facts that never change.
- Open the draft to edit pages, add or fix questions, preview, then **Save & publish**. Learners only see published lessons.
- Formatting inside pages: `**bold**` `==highlight==` `## heading` `- bullet` `1. step` `> tip` `^{2}` `_{2}` `[[1/2]]` `sqrt{x}`. Images inside lessons are not supported in v1 (a scanned PDF with no text cannot be read).

### Question text format
```
1. Which part of a plant takes in water?
A. Leaf
B. Root
C. Flower
Answer: B
Explain: Roots take in water from the soil.

Fill: The green substance in leaves is called ___. Answer: chlorophyll|chlorophil

Structured: About plants
(a) Name two parts of a plant. [2] Answer: root; stem; leaf
(b) What do leaves do? [1] Answer: They make food for the plant.
```
In a structured part, answers separated by `;` become tick-box marking points (1 mark each); a single answer becomes a model answer the learner scores against. There are no true/false questions.

## What learners get
Sign-up (teacher approves) → home with stars, streak, levels → subject lessons → swipeable reading pages with a 🔊 Listen button → test: multiple choice, then fill-in, then structured (self-marked) → results with stars and confetti. Also: timed Subject Challenge, Fix my mistakes, four colour themes, optional sounds, and Homework (upload up to 5 photos/PDF pages; you give a score and typed feedback or return it; marked work is locked; learner sees a "new mark" badge).

Fill-in answers ignore capitals and accents and treat ɛ/ɔ/ŋ as e/o/n, so children typing on a plain keyboard are not marked wrong for Ga letters.

## Teacher tools
Learners tab (approve, see passwords with the vault key, new password, reset progress, deactivate, delete) · Homework marking · Settings & backup (challenge length, two-step sign-in, download backup, restore lessons).

## Local test
`npm install`, create `.dev.vars` (the three secrets), `npx wrangler dev`. Tests: `npm test`.
