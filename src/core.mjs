// BECE Prep Zone (kids app) - API core. Platform-neutral: runs on Cloudflare Workers (D1) and in Node tests.
// Secrets: ADMIN_USERNAME, ADMIN_PASSWORD, PASSWORD_VAULT_KEY
import crypto from "node:crypto";

const SUBJECTS = ["sci", "math", "ga"];
const SESSION_MS = 7 * 24 * 3600 * 1000, ADMIN_SESSION_MS = 12 * 3600 * 1000;
const DEFAULT_SETTINGS = { mockq: 30, mockt: 45 };
const THEMES = ["sunny", "candy", "ocean", "jungle"];
const clientIp = (req) => String(req.headers.get("cf-connecting-ip") || "x").slice(0, 60);

const normQ = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 200);

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const fail = (msg, status = 400) => json({ ok: false, error: msg }, status);

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const rid = (n = 8) => crypto.randomBytes(n).toString("hex");
const clip = (s, n) => String(s ?? "").trim().slice(0, n);

function hashPw(pw) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(pw, salt, 64);
  return salt.toString("hex") + ":" + h.toString("hex");
}
function checkPw(pw, stored) {
  try {
    const [s, h] = stored.split(":");
    const calc = crypto.scryptSync(pw, Buffer.from(s, "hex"), 64);
    return crypto.timingSafeEqual(calc, Buffer.from(h, "hex"));
  } catch { return false; }
}
function safeEq(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
// Passwords are stored hashed for sign-in AND encrypted (AES-256-GCM) with PASSWORD_VAULT_KEY so the administrator can read them.
// Without PASSWORD_VAULT_KEY nothing readable is stored. Older entries made with the admin-password key can still be read once.
const keyFrom = (label, secret) => (secret ? crypto.createHash("sha256").update(label + secret).digest() : null);
const vaultKey = (env) => keyFrom("ges-vault:", env.PASSWORD_VAULT_KEY);
const legacyKey = (env) => keyFrom("ges-pw:", env.ADMIN_PASSWORD);
function encPw(pw, env) {
  const k = vaultKey(env); if (!k) return null;
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([c.update(String(pw), "utf8"), c.final()]);
  return iv.toString("hex") + ":" + c.getAuthTag().toString("hex") + ":" + enc.toString("hex");
}
function decWith(blob, k) {
  try {
    if (!k || !blob) return null;
    const [iv, tag, enc] = blob.split(":");
    const d = crypto.createDecipheriv("aes-256-gcm", k, Buffer.from(iv, "hex")); d.setAuthTag(Buffer.from(tag, "hex"));
    return Buffer.concat([d.update(Buffer.from(enc, "hex")), d.final()]).toString("utf8");
  } catch { return null; }
}
function decPw(blob, env) { const v = decWith(blob, vaultKey(env)); if (v != null) return { pw: v, legacy: false }; const l = decWith(blob, legacyKey(env)); return l != null ? { pw: l, legacy: true } : { pw: null }; }
// ---- admin two-step login (TOTP, RFC 6238)
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const b32enc = (buf) => { let bits = "", out = ""; for (const b of buf) bits += b.toString(2).padStart(8, "0"); for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)]; return out; };
const b32dec = (str) => { let bits = ""; for (const ch of str.replace(/=+$/, "")) bits += B32.indexOf(ch).toString(2).padStart(5, "0"); const out = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(out); };
function hotp(secret, counter) { const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(counter)); const h = crypto.createHmac("sha1", b32dec(secret)).update(buf).digest(); const o = h[19] & 15; return String(((h.readUInt32BE(o) & 0x7fffffff) % 1000000)).padStart(6, "0"); }
function totpStep(secret, code) { const now = Math.floor(Date.now() / 30000); for (const d of [0, -1, 1]) if (hotp(secret, now + d) === code) return now + d; return -1; }
const COMMON = new Set(["password", "12345678", "123456789", "1234567890", "qwertyui", "qwerty123", "password1", "password123", "11111111", "00000000", "abcd1234", "iloveyou", "admin123", "welcome1", "letmein1", "ghana123", "ghana2024", "ghana2025", "ghana2026", "godisgood", "jesus123", "godislove", "asdfghjk", "12341234", "123123123", "987654321", "1q2w3e4r"]);
function pwProblem(pw, username, phone) {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (COMMON.has(pw.toLowerCase())) return "That password is too common. Choose something harder to guess.";
  if (/^(.)\1+$/.test(pw)) return "Password cannot be one repeated character.";
  if (username && pw.toLowerCase().includes(username)) return "Password should not contain your username.";
  if (phone && phoneKey(phone) && pw.replace(/\D/g, "").includes(phoneKey(phone))) return "Password should not contain your phone number.";
  return "";
}
const normUser = (u) => String(u ?? "").trim().toLowerCase();
const validUser = (u) => /^[a-z0-9_.]{3,30}$/.test(u);
function phoneKey(p) {
  let d = String(p ?? "").replace(/\D/g, "");
  if (d.startsWith("233")) d = d.slice(3);
  return d.replace(/^0+/, "");
}
const validPhone = (p) => { const d = String(p ?? "").replace(/\D/g, ""); return d.length >= 9 && d.length <= 15; };


// ---------------- lessons ----------------
const QTYPES = ["mcq", "fib", "st"];
export function cleanQuestion(p) {
  if (!p || typeof p !== "object") return { error: "Bad question." };
  const t = QTYPES.includes(p.t) ? p.t : "", q = clip(p.q, 1200);
  if (!t) return { error: "Unknown question type." };
  if (!q) return { error: "A question cannot be empty." };
  if (t === "mcq") {
    const o = (Array.isArray(p.o) ? p.o : []).map((x) => clip(x, 300));
    if (o.length < 2 || o.length > 5 || o.some((x) => !x)) return { error: "A multiple-choice question needs 2 to 5 options, none empty." };
    if (new Set(o.map(normQ)).size !== o.length) return { error: "Two options are the same." };
    const c = Number(p.c); if (!Number.isInteger(c) || c < 0 || c >= o.length) return { error: "Mark the correct option." };
    return { out: { t, q, o, c, e: clip(p.e, 600) } };
  }
  if (t === "fib") {
    if ((q.match(/___/g) || []).length !== 1) return { error: "A fill-in question must contain exactly one blank written as ___" };
    const a = clip(p.a, 200); if (!a || a.split("|").every((x) => !x.trim())) return { error: "Enter the answer for the blank." };
    return { out: { t, q, a, e: clip(p.e, 600) } };
  }
  const parts = (Array.isArray(p.parts) ? p.parts : []).slice(0, 8).map((x) => ({ q: clip(x && x.q, 600), m: Math.floor(Number(x && x.m)), a: clip(x && x.a, 1200), pts: (Array.isArray(x && x.pts) ? x.pts : []).slice(0, 8).map((y) => clip(y, 200)).filter(Boolean) }));
  if (!parts.length) return { error: "A structured question needs at least one part." };
  for (const x of parts) { if (!x.q) return { error: "Every part needs its question." }; if (!(x.m >= 1 && x.m <= 20)) return { error: "Marks for each part must be 1 to 20." }; if (!x.a && !x.pts.length) return { error: "Every part needs a model answer." }; }
  return { out: { t, q, parts } };
}
export function cleanLesson(b, old) {
  const subject = SUBJECTS.includes(b.subject) ? b.subject : ""; if (!subject) return { error: "Choose a subject." };
  const title = clip(b.title, 120); if (!title) return { error: "Enter a title." };
  const pages = (Array.isArray(b.pages) ? b.pages : []).slice(0, 6).map((x) => ({ title: clip(x && x.title, 120), body: clip(x && x.body, 12000) })).filter((x) => x.body);
  if (!pages.length) return { error: "Add at least one reading page." };
  const qs = [], raw = Array.isArray(b.questions) ? b.questions : [];
  if (raw.length > 80) return { error: "At most 80 questions per lesson." };
  for (let i = 0; i < raw.length; i++) { const r = cleanQuestion(raw[i]); if (r.error) return { error: "Question " + (i + 1) + ": " + r.error }; qs.push(r.out); }
  const status = b.status === "published" ? "published" : "draft";
  if (status === "published" && !qs.length) return { error: "Add at least one test question before publishing." };
  const L = { id: old ? old.id : clip(b.id, 40) || "l" + rid(5), subject, title, emoji: clip(b.emoji, 4) || "📘", order: Math.max(0, Math.min(9999, Math.floor(Number(b.order)) || 0)), status, pages, questions: qs, source: clip(b.source, 200), updatedAt: Date.now() };
  if (JSON.stringify(L).length > 400000) return { error: "This lesson is too large." };
  return { out: L };
}
const lmeta = (l) => ({ id: l.id, subject: l.subject, title: l.title, emoji: l.emoji, order: l.order, status: l.status, np: l.pages.length, nq: l.questions.length, updatedAt: l.updatedAt });

export function createHandler(getS, env = {}) {
  return async function handler(req) {
    try { return await inner(req); } catch (e) { console.error(e); return fail("The server had a problem: " + (e && e.message ? e.message : "unknown error") + ". Please try again.", 500); }
  };
  async function inner(req) {
    if (req.method !== "POST") return fail("Method not allowed", 405);
    let body;
    try { body = await req.json(); } catch { return fail("Invalid request"); }
    const store = getS();
    const action = String(body.action || "");
    const adminName = normUser(env.ADMIN_USERNAME || "");
    const get = (k) => store.get(k, { type: "json" });
    const set = (k, v) => store.setJSON(k, v);

    // ---- rate limiting helpers
    async function limited(key, max, lockMs) {
      const r = await get("rl:" + key);
      return r && r.until && r.until > Date.now();
    }
    async function bump(key, max, lockMs) {
      const r = (await get("rl:" + key)) || { n: 0 };
      r.n = (r.n || 0) + 1;
      if (r.n >= max) { r.until = Date.now() + lockMs; r.n = 0; }
      await set("rl:" + key, r);
    }
    const clearRl = (key) => store.delete("rl:" + key);

    async function newSession(username, role) {
      const token = rid(32);
      await set("session:" + sha(token), { username, role, exp: Date.now() + (role === "admin" ? ADMIN_SESSION_MS : SESSION_MS) });
      return token;
    }
    async function auth() {
      const h = req.headers.get("authorization") || "";
      const token = h.startsWith("Bearer ") ? h.slice(7) : "";
      if (!token) return null;
      const s = await get("session:" + sha(token));
      if (!s || s.exp < Date.now()) return null;
      if (s.role === "admin") return { username: s.username, role: "admin", token };
      const u = await get("user:" + s.username);
      if (!u || u.status !== "active") return null;
      return { username: s.username, role: "user", user: u, token };
    }

    // ---------- public actions
    if (action === "register") {
      const username = normUser(body.username), password = String(body.password || ""), phone = clip(body.phone, 20);
      const fullName = clip(body.fullName, 60);
      if (fullName.length < 2) return fail("Enter the learner's full name.");
      if (!validUser(username)) return fail("Username must be 3-30 characters: letters, numbers, dot or underscore.");
      const pp = pwProblem(password, username, phone); if (pp) return fail(pp);
      const ip = clientIp(req);
      if ((await limited("regip:" + ip)) || (await limited("reg:all"))) return fail("Too many sign-ups right now. Please try again later.", 429);
      await bump("regip:" + ip, 6, 3600000); await bump("reg:all", 80, 3600000);
      if (!validPhone(phone)) return fail("Enter a valid phone number (9 to 15 digits).");
      if (username === adminName) return fail("That username is not available.");
      if (await get("user:" + username)) return fail("That username is already taken.");
      const user = { username, phone, phoneKey: phoneKey(phone), pass: hashPw(password), pwEnc: encPw(password, env), pe: 0, status: "active", createdAt: Date.now(), lastLogin: Date.now(), theme: "sunny", fullName };
      user.status = "pending";
      await set("user:" + username, user);
      return json({ ok: true, pending: true });
    }

    if (action === "login") {
      const username = normUser(body.username), password = String(body.password || "");
      if (!username || !password) return fail("Enter your username and password.");
      if (await limited("login:" + username)) return fail("Too many failed attempts. Try again in 15 minutes.", 429);
      if (adminName && username === adminName) {
        if (!env.ADMIN_PASSWORD) return fail("Admin is not configured.", 500);
        if (!safeEq(password, env.ADMIN_PASSWORD)) { await bump("login:" + username, 8, 15 * 60000); return fail("Incorrect username or password.", 401); }
        const t2 = await get("admin2fa");
        if (t2 && t2.enabled) {
          const code = String(body.code || "").replace(/\s/g, "");
          if (!code) return json({ ok: false, needCode: true, error: "Enter the 6-digit code from your authenticator app." }, 401);
          const st = totpStep(t2.secret, code);
          if (st < 0 || st <= (t2.last || 0)) { await bump("login:" + username, 8, 15 * 60000); return fail("Incorrect code.", 401); }
          t2.last = st; await set("admin2fa", t2);
        }
        await clearRl("login:" + username);
        return json({ ok: true, token: await newSession(username, "admin"), role: "admin", username, theme: "sunny" });
      }
      const u = await get("user:" + username);
      if (!u || !checkPw(password, u.pass)) { await bump("login:" + username, 8, 15 * 60000); return fail("Incorrect username or password.", 401); }
      if (u.status === "pending") return fail("Your account is awaiting approval by the administrator.", 403);
      if (u.status === "rejected") return fail("Your registration was not approved.", 403);
      if (u.status !== "active") return fail("This account has been deactivated. Contact the administrator.", 403);
      await clearRl("login:" + username);
      u.lastLogin = Date.now(); if (!u.pwEnc) u.pwEnc = encPw(password, env); await set("user:" + username, u);
      return json({ ok: true, token: await newSession(username, "user"), role: "user", username, theme: u.theme || "sunny", fullName: u.fullName || "" });
    }

    if (action === "requestReset") {
      const username = normUser(body.username), ip = clientIp(req);
      if (!(await limited("rrip:" + ip)) && !(await limited("rr:" + username)) && username && username !== adminName) {
        await bump("rrip:" + ip, 12, 3600000); await bump("rr:" + username, 3, 3600000);
        const u = await get("user:" + username);
        if (u && u.status === "active") { u.resetReq = Date.now(); await set("user:" + username, u); }
      }
      return json({ ok: true });
    }

    // ---------- authenticated actions
    const me = await auth();
    if (!me) return fail("Please sign in again.", 401);


    if (action === "logout") { await store.delete("session:" + sha(me.token)); return json({ ok: true }); }

    if (action === "me") {
      const progress = me.role === "user" ? (await get("progress:" + me.username)) || {} : {};
      let pending = 0;
      if (me.role === "admin") { const { blobs } = await store.list({ prefix: "user:" }); for (const b of blobs) { const u = await get(b.key); if (u && u.status === "pending") pending++; } }
      const t2 = me.role === "admin" ? await get("admin2fa") : null;
      let asgUnseen = 0;
      if (me.role === "user") { const { blobs } = await store.list({ prefix: "sub:" + me.username + ":" }); for (const b of blobs) { const m = await get(b.key); if (m && m.status === "marked" && !m.seen) asgUnseen++; } }
      return json({ ok: true, username: me.username, role: me.role, fullName: me.user?.fullName || "", theme: me.user?.theme || "sunny", progress, pe: me.user?.pe || 0, pending, asgUnseen, twoStep: !!(t2 && t2.enabled), vaultSet: !!vaultKey(env), settings: { ...DEFAULT_SETTINGS, ...((await get("settings")) || {}) } });
    }

    if (action === "saveState" && me.role === "user") {
      if ((Number(body.pe) || 0) !== (me.user.pe || 0)) return json({ ok: true, stale: true, progress: {}, pe: me.user.pe || 0 });
      const p = body.progress && typeof body.progress === "object" ? body.progress : {};
      if (JSON.stringify(p).length > 300000) return fail("Progress too large.");
      await set("progress:" + me.username, p);
      if (THEMES.includes(body.theme) && body.theme !== me.user.theme) { me.user.theme = body.theme; await set("user:" + me.username, me.user); }
      return json({ ok: true });
    }

    // ---------- lessons (everyone signed in reads; only the administrator writes)
    const lidx = async () => (await get("lidx")) || [];
    const reindex = async () => { const { blobs } = await store.list({ prefix: "lesson:" }); const out = []; for (const b of blobs) { const l = await get(b.key); if (l) out.push(lmeta(l)); } out.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)); await set("lidx", out); return out; };
    if (action === "lessonList") {
      const all = await lidx();
      return json({ ok: true, lessons: me.role === "admin" ? all : all.filter((x) => x.status === "published") });
    }
    if (action === "lessonGet") {
      const l = await get("lesson:" + clip(body.id, 40));
      if (!l || (me.role !== "admin" && l.status !== "published")) return fail("Lesson not found.", 404);
      return json({ ok: true, lesson: l });
    }
    if (action === "subjectQs") {
      const sub = SUBJECTS.includes(body.subject) ? body.subject : ""; if (!sub) return fail("Choose a subject.");
      const out = [];
      for (const m of (await lidx()).filter((x) => x.subject === sub && x.status === "published")) { const l = await get("lesson:" + m.id); if (l) l.questions.forEach((q, i) => { if (q.t !== "st") out.push({ ...q, lid: l.id, qi: i }); }); }
      return json({ ok: true, questions: out });
    }

    // ---------- assignments (learner side)

    const subKey = (u, a) => "sub:" + u + ":" + a, pgKey = (u, a, i) => "subp:" + u + ":" + a + ":" + i;
    async function purgeSubs(u) {
      for (const pre of ["sub:" + u + ":", "subp:" + u + ":"]) { const { blobs } = await store.list({ prefix: pre }); for (const b of blobs) await store.delete(b.key); }
    }
    const asgPub = (a) => ({ id: a.id, title: a.title, subject: a.subject, instructions: a.instructions, max: a.max, due: a.due || "", closed: !!a.closed, createdAt: a.createdAt });
    const metaPub = (m) => m ? { status: m.status, pages: m.pages, at: m.at, late: !!m.late, score: m.status === "marked" ? m.score : null, feedback: m.status === "marked" || m.status === "returned" ? m.feedback || "" : "", markedAt: m.markedAt || null, seen: !!m.seen } : null;
    const allAsg = async () => { const { blobs } = await store.list({ prefix: "asg:" }); const out = []; for (const b of blobs) { const a = await get(b.key); if (a) out.push(a); } return out.sort((x, y) => y.createdAt - x.createdAt); };
    if (me.role === "user" && ["asgList", "asgSubmit", "asgPages", "asgSeen"].includes(action)) {
      if (action === "asgList") {
        const out = [];
        for (const a of await allAsg()) { const m = await get(subKey(me.username, a.id)); if (a.closed && !m) continue; out.push({ ...asgPub(a), sub: metaPub(m) }); }
        return json({ ok: true, assignments: out });
      }
      const a = await get("asg:" + clip(body.aid, 40)); if (!a) return fail("Assignment not found.", 404);
      const m = await get(subKey(me.username, a.id));
      if (action === "asgPages") { if (!m) return json({ ok: true, pages: [] }); const pages = []; for (let i = 0; i < m.pages; i++) { const p = await get(pgKey(me.username, a.id, i)); if (p && p.d) pages.push(p.d); } return json({ ok: true, pages }); }
      if (action === "asgSeen") { if (m && m.status === "marked" && !m.seen) { m.seen = true; await set(subKey(me.username, a.id), m); } return json({ ok: true }); }
      // asgSubmit
      if (a.closed) return fail("This assignment is closed.");
      if (m && m.status === "marked") return fail("This assignment has already been marked.");
      const pages = Array.isArray(body.pages) ? body.pages : [];
      if (pages.length < 1 || pages.length > 5) return fail("Add between 1 and 5 pages.");
      let total = 0;
      for (const d of pages) { if (typeof d !== "string" || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(d)) return fail("Only photos or scans (JPEG) can be uploaded."); if (d.length > 1_100_000) return fail("One page is too large. Retake it a little further away or with less detail."); total += d.length; }
      if (total > 4_300_000) return fail("The pages are too large together. Use fewer pages or take them again.");
      for (let i = 0; i < pages.length; i++) await set(pgKey(me.username, a.id, i), { d: pages[i] });
      for (let i = pages.length; m && i < m.pages; i++) await store.delete(pgKey(me.username, a.id, i));
      const late = !!(a.due && Date.now() > new Date(a.due + "T23:59:59").getTime() + 86400000);
      const nm = { aid: a.id, username: me.username, fullName: me.user.fullName || "", status: "submitted", pages: pages.length, at: Date.now(), late, feedback: m ? m.feedback || "" : "" };
      await set(subKey(me.username, a.id), nm);
      return json({ ok: true, sub: metaPub(nm) });
    }


    // ---------- admin actions
    if (me.role !== "admin") return fail("Not allowed.", 403);

    // ---------- admin actions
    if (me.role !== "admin") return fail("Not allowed.", 403);

    // ---- BECE assignments (administrator side)
    if (action === "asgAdminList") {
      const out = [], { blobs } = await store.list({ prefix: "sub:" }), subs = [];
      for (const b of blobs) { const m = await get(b.key); if (m) subs.push(m); }
      for (const a of await allAsg()) { const mine = subs.filter((m) => m.aid === a.id); out.push({ ...asgPub(a), submitted: mine.filter((m) => m.status === "submitted").length, marked: mine.filter((m) => m.status === "marked").length, returned: mine.filter((m) => m.status === "returned").length }); }
      return json({ ok: true, assignments: out });
    }
    if (action === "asgSave") {
      const title = clip(body.title, 120); if (!title) return fail("Enter a title.");
      const subject = SUBJECTS.includes(body.subject) ? body.subject : ""; if (!subject) return fail("Choose a subject.");
      const max = Math.floor(Number(body.max)); if (!(max >= 1 && max <= 1000)) return fail("Maximum score must be between 1 and 1000.");
      const due = /^\d{4}-\d{2}-\d{2}$/.test(String(body.due || "")) ? String(body.due) : "";
      const id = clip(body.id, 40) || "a" + rid(5), old = await get("asg:" + id);
      if (clip(body.id, 40) && !old) return fail("Assignment not found.", 404);
      const a = { id, title, subject, instructions: clip(body.instructions, 4000), max, due, closed: !!body.closed, createdAt: old ? old.createdAt : Date.now() };
      await set("asg:" + id, a); return json({ ok: true, id });
    }
    if (action === "asgDelete") {
      const id = clip(body.aid, 40); if (!(await get("asg:" + id))) return fail("Assignment not found.", 404);
      const { blobs } = await store.list({ prefix: "sub:" });
      for (const b of blobs) { const m = await get(b.key); if (m && m.aid === id) { for (let i = 0; i < m.pages; i++) await store.delete(pgKey(m.username, id, i)); await store.delete(b.key); } }
      await store.delete("asg:" + id); return json({ ok: true });
    }
    if (action === "asgSubs") {
      const id = clip(body.aid, 40), a = await get("asg:" + id); if (!a) return fail("Assignment not found.", 404);
      const { blobs } = await store.list({ prefix: "sub:" }), subs = [];
      for (const b of blobs) { const m = await get(b.key); if (m && m.aid === id) subs.push({ username: m.username, fullName: m.fullName || "", status: m.status, pages: m.pages, at: m.at, late: !!m.late, score: m.score ?? null, markedAt: m.markedAt || null }); }
      const have = new Set(subs.map((x) => x.username)), missing = [];
      const ub = await store.list({ prefix: "user:" });
      for (const b of ub.blobs) { const u = await get(b.key); if (u && u.status === "active" && !have.has(u.username)) missing.push({ username: u.username, fullName: u.fullName || "" }); }
      subs.sort((x, y) => (x.status === "submitted" ? 0 : 1) - (y.status === "submitted" ? 0 : 1) || x.at - y.at);
      return json({ ok: true, assignment: asgPub(a), subs, missing });
    }
    if (action === "asgSubGet" || action === "asgMark" || action === "asgReturn" || action === "asgSubDelete") {
      const id = clip(body.aid, 40), u = normUser(body.username), a = await get("asg:" + id), m = await get(subKey(u, id));
      if (!a || !m) return fail("Submission not found.", 404);
      if (action === "asgSubGet") { const pages = []; for (let i = 0; i < m.pages; i++) { const p = await get(pgKey(u, id, i)); if (p && p.d) pages.push(p.d); } return json({ ok: true, assignment: asgPub(a), sub: { ...m, pages: undefined, n: m.pages }, pages }); }
      if (action === "asgSubDelete") { for (let i = 0; i < m.pages; i++) await store.delete(pgKey(u, id, i)); await store.delete(subKey(u, id)); return json({ ok: true }); }
      if (action === "asgReturn") { m.status = "returned"; m.feedback = clip(body.feedback, 3000); m.seen = false; delete m.score; await set(subKey(u, id), m); return json({ ok: true }); }
      const score = Number(body.score);
      if (!(score >= 0 && score <= a.max) || Math.round(score * 2) !== score * 2) return fail("Score must be from 0 to " + a.max + " (halves allowed).");
      m.status = "marked"; m.score = score; m.feedback = clip(body.feedback, 3000); m.markedAt = Date.now(); m.seen = false; await set(subKey(u, id), m); return json({ ok: true });
    }


    // ---------- lessons (administrator side)
    if (action === "lessonSave") {
      const id = clip(body.id, 40), old = id ? await get("lesson:" + id) : null;
      if (id && !old) return fail("Lesson not found.", 404);
      const r = cleanLesson(body, old); if (r.error) return fail(r.error);
      await set("lesson:" + r.out.id, r.out); await reindex(); return json({ ok: true, id: r.out.id });
    }
    if (action === "lessonDelete") {
      const id = clip(body.id, 40); if (!(await get("lesson:" + id))) return fail("Lesson not found.", 404);
      await store.delete("lesson:" + id); await reindex(); return json({ ok: true });
    }
    if (action === "lessonStatus") {
      const id = clip(body.id, 40), l = await get("lesson:" + id); if (!l) return fail("Lesson not found.", 404);
      const st = body.status === "published" ? "published" : "draft";
      if (st === "published" && !l.questions.length) return fail("Add at least one test question before publishing.");
      l.status = st; l.updatedAt = Date.now(); await set("lesson:" + id, l); await reindex(); return json({ ok: true });
    }

    // ---- admin two-step login
    if (action === "totpSetup") { const secret = b32enc(crypto.randomBytes(20)); await set("admin2fa", { secret, enabled: false, last: 0 }); return json({ ok: true, secret, uri: `otpauth://totp/BECE%20Prep%20Zone:${encodeURIComponent(adminName)}?secret=${secret}&issuer=BECE%20Prep%20Zone` }); }
    if (action === "totpEnable" || action === "totpDisable") {
      const t2 = await get("admin2fa"); if (!t2) return fail("Start the setup first.");
      const st = totpStep(t2.secret, String(body.code || "").replace(/\s/g, "")); if (st < 0) return fail("That code is not right. Check the time on your phone and try again.");
      if (action === "totpEnable") { t2.enabled = true; t2.last = st; await set("admin2fa", t2); } else await store.delete("admin2fa");
      return json({ ok: true });
    }

    if (action === "listUsers") {
      const { blobs } = await store.list({ prefix: "user:" });
      const users = [];
      for (const b of blobs) {
        const u = await get(b.key); if (!u) continue;
        const p = (await get("progress:" + u.username)) || {};
        const dp = decPw(u.pwEnc, env); if (dp.legacy && vaultKey(env)) { u.pwEnc = encPw(dp.pw, env); await set(b.key, u); }
        users.push({ username: u.username, fullName: u.fullName || "", phone: u.phone, pw: dp.pw, resetReq: u.resetReq || null, status: u.status, createdAt: u.createdAt, lastLogin: u.lastLogin, theme: u.theme, stars: p.stars || 0, lessonsDone: Object.keys(p.lessons || {}).length, streak: (p.streak && p.streak.n) || 0 });
      }
      users.sort((a, b) => b.createdAt - a.createdAt);
      return json({ ok: true, users, vaultSet: !!vaultKey(env), settings: { ...DEFAULT_SETTINGS, ...((await get("settings")) || {}) } });
    }

    if (action === "setStatus" || action === "deleteUser" || action === "adminResetPassword") {
      const username = normUser(body.username);
      const u = await get("user:" + username);
      if (!u) return fail("User not found.", 404);
      if (action === "setStatus") {
        if (!["active", "deactivated", "rejected", "pending"].includes(body.status)) return fail("Invalid status.");
        u.status = body.status; await set("user:" + username, u); return json({ ok: true });
      }
      if (action === "deleteUser") {
        await store.delete("user:" + username); await store.delete("progress:" + username); await purgeSubs(username); return json({ ok: true });
      }
      const np = String(body.newPassword || "");
      const pp2 = pwProblem(np, username, ""); if (pp2) return fail(pp2);
      u.pass = hashPw(np); u.pwEnc = encPw(np, env); delete u.resetReq; await set("user:" + username, u); return json({ ok: true, vault: !!vaultKey(env) });
    }

    if (action === "adminResetProgress") {
      const username = normUser(body.username); const u = await get("user:" + username);
      if (!u) return fail("User not found.", 404);
      u.pe = (u.pe || 0) + 1; await set("user:" + username, u); await set("progress:" + username, {});
      return json({ ok: true });
    }
    if (action === "adminResetAllProgress") {
      const { blobs } = await store.list({ prefix: "user:" }); let n = 0;
      for (const b of blobs) { const u = await get(b.key); if (!u) continue; u.pe = (u.pe || 0) + 1; await set(b.key, u); await set("progress:" + u.username, {}); n++; }
      return json({ ok: true, reset: n });
    }

    if (action === "approveAll") {
      const { blobs } = await store.list({ prefix: "user:" }); let n = 0;
      for (const b of blobs) { const u = await get(b.key); if (u && u.status === "pending") { u.status = "active"; await set(b.key, u); n++; } }
      return json({ ok: true, approved: n });
    }


    if (action === "exportAll") {
      const { blobs } = await store.list({ prefix: "user:" }); const users = [];
      for (const b of blobs) { const u = await get(b.key); if (!u) continue; const { pass, pwEnc, ...rest } = u; users.push({ ...rest, progress: (await get("progress:" + u.username)) || {} }); }
      const asg = []; { const { blobs } = await store.list({ prefix: "asg:" }); for (const b of blobs) { const a = await get(b.key); if (a) asg.push(a); } }
      const subs = []; { const { blobs } = await store.list({ prefix: "sub:" }); for (const b of blobs) { const m = await get(b.key); if (m) subs.push(m); } }
      const lessons = []; { const { blobs } = await store.list({ prefix: "lesson:" }); for (const b of blobs) { const l = await get(b.key); if (l) lessons.push(l); } }
      return json({ ok: true, exportedAt: Date.now(), lessons, assignments: asg, submissions: subs, users, settings: (await get("settings")) || DEFAULT_SETTINGS });
    }
    if (action === "importLessons") {
      const arr = Array.isArray(body.lessons) ? body.lessons : []; let n = 0;
      for (const x of arr.slice(0, 300)) { const r = cleanLesson({ ...x, id: x.id }, null); if (r.out) { if (x.id) r.out.id = clip(x.id, 40) || r.out.id; await set("lesson:" + r.out.id, r.out); n++; } }
      await reindex(); return json({ ok: true, imported: n });
    }
    if (action === "setSettings") {
      const n = (v, lo, hi, d) => Math.min(hi, Math.max(lo, parseInt(v, 10) || d));
      const st = { mockq: n(body.mockq, 5, 100, 30), mockt: n(body.mockt, 5, 180, 45) };
      await set("settings", st); return json({ ok: true, settings: st });
    }

    return fail("Unknown action.", 404);
  }
}
