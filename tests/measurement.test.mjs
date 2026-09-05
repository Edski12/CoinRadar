import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createMeasurementOverlay,
  formatMeasurement,
  formatMeasurementDuration,
} from "../assets/js/shared/measurement.js";

test("formats measurement duration at useful chart scales", () => {
  assert.equal(formatMeasurementDuration(30_000), "30s");
  assert.equal(formatMeasurementDuration(5_400_000), "1h 30m");
  assert.equal(formatMeasurementDuration(183_600_000), "2d 3h");
  assert.equal(formatMeasurementDuration(Number.NaN), "—");
});

test("measurement never exposes invalid time text during placement", () => {
  assert.equal(
    formatMeasurement(
      { value: 100 },
      { value: 101 },
    ),
    "+1.00 (+1.00%) • —",
  );
});

test("formats positive and negative price measurements", () => {
  assert.equal(
    formatMeasurement(
      { timestamp: 0, value: 100 },
      { timestamp: 3_600_000, value: 125 },
    ),
    "+25.00 (+25.00%) • 1h",
  );
  assert.equal(
    formatMeasurement(
      { timestamp: 0, value: 50 },
      { timestamp: 60_000, value: 45 },
    ),
    "−5.00 (−10.00%) • 1m",
  );
});

test("measurement overlay renders an area, line, and label", () => {
  const overlay = createMeasurementOverlay();
  const figures = overlay.createPointFigures({
    chart: { getDataList: () => [] },
    overlay: {
      points: [
        { timestamp: 0, value: 100 },
        { timestamp: 60_000, value: 110 },
      ],
    },
    coordinates: [{ x: 10, y: 100 }, { x: 100, y: 50 }],
    bounding: { width: 500, height: 300 },
  });

  assert.equal(overlay.totalStep, 3);
  assert.deepEqual(figures.map(({ type }) => type), ["rect", "rect", "line", "rect", "text"]);
  assert.equal(figures[4].attrs.text, "+10.00 (+10.00%) • 1m");
});

test("measurement resolves live drawing indices to candle timestamps", () => {
  const overlay = createMeasurementOverlay();
  const figures = overlay.createPointFigures({
    chart: {
      getDataList: () => [
        { timestamp: 1_000 },
        { timestamp: 61_000 },
      ],
    },
    overlay: {
      points: [
        { dataIndex: 0, value: 100 },
        { dataIndex: 1, value: 105 },
      ],
    },
    coordinates: [{ x: 10, y: 100 }, { x: 100, y: 50 }],
    bounding: { width: 500, height: 300 },
  });

  assert.equal(figures[4].attrs.text, "+5.00 (+5.00%) • 1m");
});
