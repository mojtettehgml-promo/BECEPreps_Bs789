import { createHandler, cleanQuestion, cleanLesson } from "./src/core.mjs";
const mem = new Map();
const store = { async get(k) { return mem.has(k) ? JSON.parse(mem.get(k)) : null }, async setJSON(k, v) { mem.set(k, JSON.stringify(v)) }, async delete(k) { mem.delete(k) }, async list({ prefix }) { return { blobs: [...mem.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) } } };
const h = createHandler(() => store, { ADMIN_USERNAME: "Boss", ADMIN_PASSWORD: "S3cret!x", PASSWORD_VAULT_KEY: "vk" });
let n = 0;
const call = async (b, t) => { const r = await h(new Request("http://x/api", { method: "POST", headers: { ...(t ? { authorization: "Bearer " + t } : {}), "cf-connecting-ip": "7.7.7." + (++n) }, body: JSON.stringify(b) })); return { s: r.status, ...(await r.json()) } };
const ok = (c, m) => { if (!c) { console.error("FAIL", m); process.exitCode = 1 } else console.log("ok", m) };
const jpeg = "data:image/jpeg;base64,/9j/4AAQ";

// sign-up
let r = await call({ action: "register", username: "ama", password: "Strong#pass1", phone: "0241234567" }); ok(!r.ok, "full name is required");
r = await call({ action: "register", username: "ama", password: "Strong#pass1", phone: "0241234567", fullName: "Ama Mensah", level: "b8" }); ok(r.ok && r.pending, "learner registers (pending)");
r = await call({ action: "login", username: "ama", password: "Strong#pass1" }); ok(r.s === 403, "pending learner cannot sign in");
const adm = (await call({ action: "login", username: "boss", password: "S3cret!x" })).token; ok(!!adm, "admin signs in");
r = await call({ action: "approveAll" }, adm); ok(r.approved === 1, "approve all");
r = await call({ action: "login", username: "ama", password: "Strong#pass1" }); ok(r.ok && r.theme === "sunny" && r.fullName === "Ama Mensah", "learner signs in with kid theme");
const tok = r.token;
r = await call({ action: "listUsers" }, adm); ok(r.users[0].pw === "Strong#pass1" && !("rank" in r.users[0]), "admin sees vault password, no ranks");

// lessons validation
const L1 = { subject: "sci", title: "Living Things", emoji: "🌱", order: 1, pages: [{ title: "What is life?", body: "## Hello\n**Plants** grow." }, { title: "More", body: "Animals move." }], questions: [
  { t: "mcq", q: "Which one is alive?", o: ["Rock", "Tree", "Chair"], c: 1, e: "Trees grow." },
  { t: "fib", q: "Plants make food by ___.", a: "photosynthesis|photo synthesis" },
  { t: "st", q: "About plants", parts: [{ q: "Name two parts of a plant.", m: 2, pts: ["root", "stem", "leaf"] }, { q: "What do roots do?", m: 1, a: "Take in water." }] }] };
r = await call({ action: "lessonSave", ...L1 }, tok); ok(r.s === 403, "learner cannot save lessons");
r = await call({ action: "lessonSave", ...L1, subject: "history" }, adm); ok(!r.ok, "unknown subject refused");
r = await call({ action: "lessonSave", ...L1, pages: [] }, adm); ok(!r.ok, "needs a reading page");
r = await call({ action: "lessonSave", ...L1, kind: "test", pages: [], status: "published", questions: [] }, adm); ok(!r.ok, "a test cannot be published without questions");
r = await call({ action: "lessonSave", ...L1, questions: [{ t: "mcq", q: "x", o: ["a", "a"], c: 0 }] }, adm); ok(!r.ok, "duplicate options refused");
r = await call({ action: "lessonSave", ...L1, questions: [{ t: "fib", q: "no blank", a: "x" }] }, adm); ok(!r.ok, "fill-in needs exactly one blank");
r = await call({ action: "lessonSave", ...L1, questions: [{ t: "tf", q: "True?", a: "t" }] }, adm); ok(!r.ok, "true/false type is not accepted");
r = await call({ action: "lessonSave", ...L1, status: "published", questions: [{ t: "st", q: "s", parts: [{ q: "a", m: 2 }] }] }, adm); ok(!r.ok, "structured part needs a model answer to publish");
r = await call({ action: "lessonSave", ...L1 }, adm); ok(r.ok && r.id, "draft lesson saved"); const id = r.id;
r = await call({ action: "lessonList" }, tok); ok(r.ok && r.lessons.length === 0, "learner does not see drafts");
r = await call({ action: "lessonGet", id }, tok); ok(r.s === 404, "learner cannot open a draft");
r = await call({ action: "lessonList" }, adm); ok(r.lessons.length === 1 && r.lessons[0].np === 2 && r.lessons[0].nq === 3 && r.lessons[0].status === "draft", "admin sees the draft with counts");
r = await call({ action: "lessonStatus", id, status: "published" }, adm); ok(r.ok, "publish");
r = await call({ action: "lessonList" }, tok); ok(r.lessons.length === 1 && r.lessons[0].title === "Living Things", "learner sees the published lesson");
r = await call({ action: "lessonGet", id }, tok); ok(r.ok && r.lesson.pages.length === 2 && r.lesson.questions[2].parts.length === 2, "learner opens it with pages and questions");
r = await call({ action: "subjectQs", subject: "sci" }, tok); ok(r.questions.length === 2 && r.questions.every((q) => q.t !== "st" && q.lid === id), "subject pool has MCQ and fill-in only");
r = await call({ action: "subjectQs", subject: "math" }, tok); ok(r.ok && r.questions.length === 0, "empty subject is empty");
r = await call({ action: "lessonSave", id, ...L1, title: "Living Things 2", status: "published" }, adm); ok(r.ok && r.id === id, "edit keeps the id");
r = await call({ action: "lessonList" }, tok); ok(r.lessons[0].title === "Living Things 2", "index updated");
ok(cleanQuestion({ t: "mcq", q: "x", o: ["a", "b"], c: 5 }).error, "bad correct index refused");

// progress
r = await call({ action: "saveState", progress: { stars: 7, lessons: { [id]: { best: 3 } } }, theme: "candy", pe: 0 }, tok); ok(r.ok, "progress saved");
r = await call({ action: "me" }, tok); ok(r.progress.stars === 7 && r.theme === "candy" && r.settings.mockq === 30, "progress, theme and settings come back");
r = await call({ action: "saveState", progress: {}, theme: "savannah", pe: 0 }, tok); r = await call({ action: "me" }, tok); ok(r.theme === "candy", "unknown theme ignored");
r = await call({ action: "adminResetProgress", username: "ama" }, adm); r = await call({ action: "saveState", progress: { stars: 99 }, pe: 0 }, tok); ok(r.stale, "stale device cannot overwrite a reset");

// assignments
r = await call({ action: "asgSave", title: "Ga essay", subject: "bga", max: 20 }, adm); ok(!r.ok, "old subject codes refused");
r = await call({ action: "asgSave", title: "Fractions sheet", subject: "math", max: 20, instructions: "Show working" }, adm); ok(r.ok, "assignment created"); const aid = r.id;
r = await call({ action: "asgList" }, tok); ok(r.assignments.length === 1, "learner sees it");
r = await call({ action: "asgSubmit", aid, pages: [] }, tok); ok(!r.ok, "needs at least one page");
r = await call({ action: "asgSubmit", aid, pages: ["data:image/png;base64,AAAA"] }, tok); ok(!r.ok, "only JPEG pages accepted");
r = await call({ action: "asgSubmit", aid, pages: Array(6).fill(jpeg) }, tok); ok(!r.ok, "max 5 pages");
r = await call({ action: "asgSubmit", aid, pages: [jpeg, jpeg] }, tok); ok(r.ok && r.sub.status === "submitted", "learner submits 2 pages");
r = await call({ action: "asgSubs", aid }, adm); ok(r.subs.length === 1 && r.subs[0].fullName === "Ama Mensah", "admin sees the submission with the name");
r = await call({ action: "asgSubGet", aid, username: "ama" }, adm); ok(r.pages.length === 2, "admin opens pages");
r = await call({ action: "asgMark", aid, username: "ama", score: 25, feedback: "x" }, adm); ok(!r.ok, "score above max refused");
r = await call({ action: "asgMark", aid, username: "ama", score: 17.5, feedback: "Well done, check Q3." }, adm); ok(r.ok, "marked");
r = await call({ action: "me" }, tok); ok(r.asgUnseen === 1, "learner has a new mark");
r = await call({ action: "asgList" }, tok); ok(r.assignments[0].sub.score === 17.5 && r.assignments[0].sub.feedback.startsWith("Well"), "learner sees mark and feedback");
r = await call({ action: "asgSeen", aid }, tok); r = await call({ action: "me" }, tok); ok(r.asgUnseen === 0, "badge cleared");
r = await call({ action: "asgSubmit", aid, pages: [jpeg] }, tok); ok(!r.ok, "marked work is locked");
r = await call({ action: "asgReturn", aid, username: "ama", feedback: "Redo please" }, adm); r = await call({ action: "asgSubmit", aid, pages: [jpeg] }, tok); ok(r.ok, "returned work can be resubmitted");

// backup, settings, delete
r = await call({ action: "exportAll" }, adm); ok(r.ok && r.lessons.length === 1 && r.assignments.length === 1 && r.users.length === 1 && !JSON.stringify(r).includes("scrypt") && !r.users[0].pass, "backup has lessons, work, users and no password hashes");
const backup = r.lessons;
// v1.1: levels, topics, computing, pictures, idea-scored structured questions
r = await call({ action: "lessonSave", subject: "comp", level: "b8", topic: "1.1 Hardware", title: "Parts of a computer", pages: [{ title: "a", body: "b" }], status: "published" }, adm); ok(r.ok, "Computing lesson (reading only) can be published, Basic 8");
r = await call({ action: "lessonSave", subject: "comp", level: "b99", title: "x", pages: [{ body: "b" }] }, adm); ok(r.ok, "unknown level falls back to Basic 7"); const odd = r.id;
r = await call({ action: "lessonList" }, tok); const cl = r.lessons.find((l) => l.subject === "comp" && l.level === "b8"); ok(cl && cl.topic === "1.1 Hardware" && cl.kind === "learn", "list carries level, topic and kind");
r = await call({ action: "lessonDelete", id: odd }, adm);
const IDEA = { t: "test", kind: "test", subject: "sci", level: "b7", topic: "1.1 Materials", title: "Topic test", status: "published", questions: [{ t: "st", q: "States of matter", parts: [{ q: "Name the three states.", m: 2, a: "Solid, liquid and gas.", ideas: [{ t: "solid", k: ["solid"] }, { t: "liquid", k: ["liquid", "fluid"] }, { t: "gas", k: ["gas", "vapour"] }] }] }] };
r = await call({ action: "lessonSave", ...IDEA }, adm); ok(r.ok, "test lesson with key ideas saved"); const tid2 = r.id;
r = await call({ action: "lessonGet", id: tid2 }, tok); ok(r.lesson.questions[0].parts[0].ideas.length === 3 && r.lesson.questions[0].parts[0].ideas[1].k[1] === "fluid", "key ideas and key words come back");
r = await call({ action: "lessonSave", ...IDEA, questions: [{ t: "st", q: "q", parts: [{ q: "p", m: 1, ideas: [{ t: "idea", k: [] }] }] }] }, adm); ok(!r.ok, "publishing an idea with no key word is refused");
r = await call({ action: "lessonSave", ...IDEA, status: "draft", questions: [{ t: "st", q: "q", parts: [{ q: "p", m: 1 }] }] }, adm); ok(r.ok, "a draft may keep a part that still needs its answer"); await call({ action: "lessonDelete", id: r.id }, adm);
r = await call({ action: "lessonSave", ...IDEA, questions: [{ t: "st", q: "q", parts: [{ q: "p", m: 1 }] }] }, adm); ok(!r.ok, "publishing a part with no answer is refused");
r = await call({ action: "imgSave", d: "data:image/png;base64,iVBORw0KGgo=" }, tok); ok(r.s === 403, "learner cannot upload pictures");
r = await call({ action: "imgSave", d: "data:image/svg+xml;base64,AAAA" }, adm); ok(!r.ok, "only jpeg/png/webp pictures");
r = await call({ action: "imgSave", d: "data:image/png;base64,iVBORw0KGgo=" }, adm); ok(r.ok && r.id, "admin uploads a picture"); const imgId = r.id;
r = await call({ action: "imgGet", id: imgId }, tok); ok(r.ok && r.d.startsWith("data:image/png"), "learner can load it");
r = await call({ action: "setLevel", level: "b9" }, tok); r = await call({ action: "me" }, tok); ok(r.level === "b9", "learner changes level");
r = await call({ action: "setLevel", level: "b1" }, tok); ok(!r.ok, "bad level refused");
r = await call({ action: "subjectQs", subject: "sci", level: "b8" }, tok); ok(r.ok && r.questions.length === 0, "challenge questions filter by level");
r = await call({ action: "exportAll" }, adm); ok(r.images.length === 1 && r.images[0].id === imgId, "backup includes pictures");
r = await call({ action: "setSettings", mockq: 20, mockt: 30 }, adm); ok(r.settings.mockq === 20, "settings saved");
r = await call({ action: "lessonDelete", id }, adm); r = await call({ action: "lessonList" }, adm); ok(!r.lessons.some((l) => l.id === id), "lesson deleted");
r = await call({ action: "importLessons", lessons: backup }, adm); r = await call({ action: "lessonList" }, tok); ok(r.lessons.some((l) => l.id === id), "lessons restore from backup");
r = await call({ action: "deleteUser", username: "ama" }, adm); r = await call({ action: "asgSubs", aid }, adm); ok(r.subs.length === 0, "deleting a learner removes their work");
r = await call({ action: "login", username: "ama", password: "Strong#pass1" }); ok(r.s === 401, "deleted learner cannot sign in");
r = await call({ action: "content" }, adm); ok(r.s === 404, "promotion endpoints are gone");
