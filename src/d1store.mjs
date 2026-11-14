// Key-value store on Cloudflare D1 with the same small interface the app used on Netlify Blobs:
//   get(key) -> parsed JSON or null, setJSON(key, value), delete(key), list({prefix}) -> { blobs: [{ key }] }
export const SCHEMA = "CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL) WITHOUT ROWID";
export function d1Store(db) {
  return {
    async get(k) { const v = await db.prepare("SELECT v FROM kv WHERE k = ?").bind(k).first("v"); return v == null ? null : JSON.parse(v); },
    async setJSON(k, v) { await db.prepare("INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(k, JSON.stringify(v)).run(); },
    async delete(k) { await db.prepare("DELETE FROM kv WHERE k = ?").bind(k).run(); },
    async list({ prefix = "" } = {}) {
      const { results } = await db.prepare("SELECT k FROM kv WHERE k >= ? AND k < ? ORDER BY k").bind(prefix, prefix + "￿").all();
      return { blobs: results.map((r) => ({ key: r.k })) };
    },
  };
}
