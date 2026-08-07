const endpoint = "../api/watchlist.php";

export async function readWatchlist() {
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error("Unable to load your watchlist.");
  return response.json();
}

export async function upsertHolding(symbol, amount) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, amount }),
  });
  if (!response.ok) throw new Error("Unable to save the coin.");
}

export async function removeHolding(symbol) {
  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
  if (!response.ok) throw new Error("Unable to remove the coin.");
}
