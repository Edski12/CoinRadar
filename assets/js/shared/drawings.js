export function createDrawingStore({ chart, symbol, user, csrf, onStatus, onReady }) {
  const endpoint = "../api/drawings.php";
  const drawings = new Map();
  let ready = !user;
  let loading = false;
  let saving = false;
  let revision = 0;
  let savedRevision = 0;
  let suppressEvents = false;

  function status(message, retry = false) {
    onStatus(message, retry);
  }

  async function save() {
    if (!user || !ready || saving || revision === savedRevision) return;
    saving = true;
    status("Saving drawings…");
    try {
      // Serialize requests so an older save cannot overwrite a newer edit.
      while (savedRevision !== revision) {
        const sentRevision = revision;
        const body = JSON.stringify({ symbol, drawings: [...drawings.values()] });
        if (new TextEncoder().encode(body).length > 60000) {
          throw new Error("Too many drawings to save. Remove some and retry.");
        }
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf, "X-Drawing-User": String(user.id) },
          credentials: "same-origin",
          keepalive: true,
          body,
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Couldn't save drawings. Please retry.");
        }
        savedRevision = sentRevision;
      }
      status("Drawings saved");
    } catch (error) {
      status(error.message || "Couldn't save drawings. Please retry.", true);
    } finally {
      saving = false;
    }
  }

  function changed() {
    if (suppressEvents || !ready) return;
    revision += 1;
    void save();
  }

  function remember({ overlay }) {
    if (suppressEvents || !ready) return false;
    const candles = chart.getDataList();
    const spacing = candles.length > 1 ? candles[1].timestamp - candles[0].timestamp : 60000;
    const points = overlay.points.map((point) => ({
      // Store time, never a candle index that changes when data or timeframe changes.
      timestamp: point.timestamp ?? (candles[0].timestamp + point.dataIndex * spacing),
      value: point.value,
    }));
    // Discard stale indices in the live overlay as well, including after dragging.
    overlay.points = points.map((point) => ({ ...point }));
    drawings.set(overlay.id, { id: overlay.id, name: overlay.name, points });
    changed();
    return false;
  }

  const callbacks = {
    onDrawEnd: remember,
    onPressedMoveEnd: remember,
    onRemoved: ({ overlay }) => {
      if (!suppressEvents && drawings.delete(overlay.id)) changed();
      return false;
    },
  };

  async function load() {
    if (ready || loading) return;
    loading = true;
    status("Loading your drawings…");
    try {
      const response = await fetch(`${endpoint}?symbol=${encodeURIComponent(symbol)}`, {
        headers: { "X-Drawing-User": String(user.id) },
        credentials: "same-origin", cache: "no-store",
      });
      if (!response.ok) throw new Error("Couldn't load drawings. Please retry.");
      const data = await response.json();
      if (!Array.isArray(data.drawings)) throw new Error("Couldn't load drawings. Please retry.");
      suppressEvents = true;
      for (const drawing of data.drawings) {
        if (!chart.createOverlay({ ...drawing, ...callbacks })) {
          throw new Error("Couldn't restore drawings. Reload the page to retry.");
        }
        drawings.set(drawing.id, drawing);
      }
      ready = true;
      onReady(true);
      status("Drawings saved automatically for this coin");
    } catch (error) {
      // Never allow an empty/partial load to replace previously saved drawings.
      suppressEvents = true;
      chart.removeOverlay();
      drawings.clear();
      status(error.message, true);
    } finally {
      suppressEvents = false;
      loading = false;
    }
  }

  onReady(ready);
  status(user ? "Loading your drawings…" : "Sign in to save drawings to your account.");
  window.addEventListener("online", () => { if (ready) void save(); });
  window.addEventListener("beforeunload", (event) => {
    if (user && revision !== savedRevision) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  return {
    load,
    retry: () => ready ? save() : load(),
    create(name) {
      if (ready) chart.createOverlay({ name, ...callbacks });
    },
    clear() {
      if (!ready) return;
      suppressEvents = true;
      chart.removeOverlay();
      drawings.clear();
      suppressEvents = false;
      changed();
    },
  };
}
