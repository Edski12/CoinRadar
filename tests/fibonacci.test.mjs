import assert from "node:assert/strict";
import { test } from "node:test";
import { createFiniteFibonacciOverlay } from "../assets/js/shared/fibonacci.js";

test("fibonacci levels stop at the two drawn endpoints", () => {
  const overlay = createFiniteFibonacciOverlay();
  const figures = overlay.createPointFigures({
    coordinates: [{ x: 40, y: 200 }, { x: 240, y: 100 }],
  });
  const lines = figures.filter(({ type }) => type === "line");

  assert.equal(overlay.totalStep, 3);
  assert.equal(lines.length, 7);
  for (const line of lines) {
    assert.equal(line.attrs.coordinates[0].x, 40);
    assert.equal(line.attrs.coordinates[1].x, 240);
  }
  assert.deepEqual(
    figures.filter(({ type }) => type === "text").map(({ attrs }) => attrs.text),
    ["0%", "23.6%", "38.2%", "50.0%", "61.8%", "78.6%", "100%"],
  );
});
