import { createHandler } from "./core.mjs";
import { d1Store, SCHEMA } from "./d1store.mjs";
let ready = null;
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api") return env.ASSETS.fetch(request);
    if (!env.DB) return Response.json({ ok: false, error: "The database is not connected. See README step 2." }, { status: 500 });
    ready ||= env.DB.prepare(SCHEMA).run().catch((e) => { ready = null; throw e; });
    await ready;
    return createHandler(() => d1Store(env.DB), env)(request);
  },
};
