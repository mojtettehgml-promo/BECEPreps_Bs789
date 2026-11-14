# BECE Prep Zone — v1.0 (Cloudflare)
A child-friendly BECE revision app: **Integrated Science, Mathematics, Ghanaian Language (Ga)**. It starts empty; you add the topics.

## Deploy
Same steps as the Trainer: GitHub repo → create D1 database `bece-prep-zone` and paste its ID into `wrangler.jsonc` → Workers Builds import (deploy command `npx wrangler deploy`) → add secrets `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `PASSWORD_VAULT_KEY`. Use the Workers **Paid** plan (sign-in hashing needs more than the Free 10 ms CPU).

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
