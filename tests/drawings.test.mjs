import assert from "node:assert/strict";
import { test } from "node:test";
import { createDrawingStore } from "../assets/js/shared/drawings.js";

const line = () => ({
  id: "line-1",
  name: "straightLine",
  points: [
    { timestamp: 100000, value: 50 },
    { timestamp: 160000, value: 60 },
  ],
});
const tick = () => new Promise((resolve) => setImmediate(resolve));

function setup(t, handler, user = { id: 7 }) {
  const events = {};
  const overlays = new Map();
  const requests = [];
  const statuses = [];
  let ready;
  t.mock.method(globalThis, "fetch", async (url, options = {}) => {
    requests.push({ url, ...options });
    return handler(url, options);chat
  });
  const oldWindow = globalThis.window;
  globalThis.window = {
    addEventListener: (name, callback) => {
      events[name] = callback;
    },
  };
  t.after(() => {
    globalThis.window = oldWindow;
  });
  const chart = {
    getDataList: () => [{ timestamp: 100000 }, { timestamp: 160000 }],
    createOverlay(overlay) {
      overlays.set(overlay.id ?? "new", overlay);
      return overlay.id ?? "new";
    },
    removeOverlay() {
      for (const overlay of overlays.values()) overlay.onRemoved({ overlay });
      overlays.clear();
    },
  };
  const store = createDrawingStore({
    chart,
    symbol: "BTCUSDT",
    user,
    csrf: "token",
    onStatus: (...status) => statuses.push(status),
    onReady: (value) => {
      ready = value;
    },
  });
  return { store, requests, overlays, statuses, events, isReady: () => ready };
}
const ok = (data) => new Response(JSON.stringify(data), { status: 200 });

test("restores drawings without writing, then saves edits with timestamps and account identity", async (t) => {
  const ctx = setup(t, (_, options) =>
    ok(options.method ? { ok: true } : { drawings: [line()] }),
  );
  await ctx.store.load();
  assert.equal(ctx.isReady(), true);
  assert.equal(ctx.requests.length, 1);
  const overlay = ctx.overlays.get("line-1");
  overlay.points[1] = { dataIndex: 3, value: 70 };
  overlay.onPressedMoveEnd({ overlay });
  await tick();
  const request = ctx.requests[1];
  assert.equal(request.headers["X-Drawing-User"], "7");
  assert.equal(request.headers["X-CSRF-Token"], "token");
  assert.deepEqual(JSON.parse(request.body).drawings[0].points[1], {
    timestamp: 280000,
    value: 70,
  });
  assert.deepEqual(overlay.points[1], { timestamp: 280000, value: 70 });
});

test("serializes pending edits so clear is saved after an in-flight drawing save", async (t) => {
  let complete;
  const ctx = setup(t, (_, options) =>
    options.method
      ? new Promise((resolve) => {
          complete = resolve;
        })
      : ok({ drawings: [] }),
  );
  await ctx.store.load();
  ctx.store.create("straightLine");
  const overlay = { ...ctx.overlays.get("new"), ...line() };
  overlay.onDrawEnd({ overlay });
  ctx.store.clear();
  assert.equal(ctx.requests.length, 2);
  complete(ok({ ok: true }));
  await tick();
  assert.equal(ctx.requests.length, 3);
  assert.deepEqual(JSON.parse(ctx.requests[2].body).drawings, []);
  complete(ok({ ok: true }));
  await tick();
  assert.deepEqual(ctx.statuses.at(-1), ["Drawings saved", false]);
});

test("a failed load blocks editing until retry succeeds", async (t) => {
  let failed = true;
  const ctx = setup(t, () =>
    failed ? new Response("", { status: 503 }) : ok({ drawings: [line()] }),
  );
  await ctx.store.load();
  ctx.store.create("straightLine");
  ctx.store.clear();
  assert.equal(ctx.isReady(), false);
  assert.equal(ctx.requests.length, 1);
  failed = false;
  await ctx.store.retry();
  assert.equal(ctx.isReady(), true);
  assert.equal(ctx.overlays.size, 1);
});

test("a failed save retains changes, reports retry, and warns before leaving", async (t) => {
  let failed = true;
  const ctx = setup(t, (_, options) =>
    !options.method
      ? ok({ drawings: [line()] })
      : failed
        ? new Response(JSON.stringify({ error: "Offline" }), { status: 503 })
        : ok({ ok: true }),
  );
  await ctx.store.load();
  ctx.store.clear();
  await tick();
  assert.deepEqual(ctx.statuses.at(-1), ["Offline", true]);
  let prevented = false;
  ctx.events.beforeunload({
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  failed = false;
  await ctx.store.retry();
  assert.deepEqual(JSON.parse(ctx.requests.at(-1).body).drawings, []);
  prevented = false;
  ctx.events.beforeunload({
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, false);
});

test("individual deletion persists without resurrecting the removed drawing", async (t) => {
  const ctx = setup(t, (_, options) =>
    ok(options.method ? { ok: true } : { drawings: [line()] }),
  );
  await ctx.store.load();
  const overlay = ctx.overlays.get("line-1");
  overlay.onRemoved({ overlay });
  await tick();
  assert.deepEqual(JSON.parse(ctx.requests.at(-1).body).drawings, []);
});

test("guest drawings do not read or write any account", async (t) => {
  const ctx = setup(t, () => assert.fail("Unexpected account request"), null);
  await ctx.store.load();
  ctx.store.create("straightLine");
  const overlay = { ...ctx.overlays.get("new"), ...line() };
  overlay.onDrawEnd({ overlay });
  ctx.store.clear();
  assert.equal(ctx.requests.length, 0);
  assert.equal(ctx.isReady(), true);
});
