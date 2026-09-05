function pricePrecision(value) {
  const amount = Math.abs(value);
  if (amount >= 100) return 2;
  if (amount >= 1) return 4;
  return 8;
}

export function formatMeasurementDuration(milliseconds) {
  if (!Number.isFinite(Number(milliseconds))) return "—";
  const totalSeconds = Math.max(0, Math.round(Math.abs(milliseconds) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length || (seconds && !days && !hours)) parts.push(`${seconds}s`);
  return parts.join(" ");
}

export function formatMeasurement(start, end) {
  const startValue = Number(start?.value);
  const endValue = Number(end?.value);
  const change = endValue - startValue;
  const percent = startValue === 0 ? null : (change / Math.abs(startValue)) * 100;
  const sign = change > 0 ? "+" : change < 0 ? "−" : "";
  const absoluteChange = Math.abs(change).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: pricePrecision(change),
  });
  const percentage = percent === null
    ? "n/a"
    : `${percent > 0 ? "+" : percent < 0 ? "−" : ""}${Math.abs(percent).toFixed(2)}%`;
  const duration = formatMeasurementDuration(Number(end?.timestamp) - Number(start?.timestamp));

  return `${sign}${absoluteChange} (${percentage}) • ${duration}`;
}

export function createMeasurementOverlay() {
  return {
    name: "measurement",
    totalStep: 3,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: ({ chart, overlay, coordinates, bounding }) => {
      if (coordinates.length !== 2 || overlay.points.length !== 2) return [];

      const [first, second] = coordinates;
      const candles = chart?.getDataList?.() || [];
      const points = overlay.points.map((point) => {
        const dataIndex = Number.isFinite(Number(point.dataIndex))
          ? Math.round(Number(point.dataIndex))
          : null;
        return {
          ...point,
          timestamp: point.timestamp ?? (dataIndex === null ? undefined : candles[dataIndex]?.timestamp),
        };
      });
      const isGain = Number(points[1].value) >= Number(points[0].value);
      const color = isGain ? "#16a34a" : "#dc2626";
      const fill = isGain ? "rgba(22, 163, 74, 0.12)" : "rgba(220, 38, 38, 0.12)";
      const label = formatMeasurement(points[0], points[1]);
      const labelWidth = Math.min(Math.max(label.length * 7 + 20, 150), bounding.width - 12);
      const labelHeight = 28;
      const centerX = (first.x + second.x) / 2;
      const centerY = (first.y + second.y) / 2;
      const labelX = Math.min(Math.max(centerX - labelWidth / 2, 6), bounding.width - labelWidth - 6);
      const labelY = Math.min(Math.max(centerY - labelHeight / 2, 6), bounding.height - labelHeight - 6);

      return [
        {
          key: "measurement-area",
          type: "rect",
          attrs: {
            x: Math.min(first.x, second.x),
            y: Math.min(first.y, second.y),
            width: Math.abs(second.x - first.x),
            height: Math.abs(second.y - first.y),
          },
          styles: { style: "fill", color: fill },
        },
        {
          key: "measurement-border",
          type: "rect",
          attrs: {
            x: Math.min(first.x, second.x),
            y: Math.min(first.y, second.y),
            width: Math.abs(second.x - first.x),
            height: Math.abs(second.y - first.y),
          },
          styles: { style: "stroke", color, size: 1 },
        },
        {
          key: "measurement-line",
          type: "line",
          attrs: { coordinates: [first, second] },
          styles: { color, size: 1, style: "dashed", dashedValue: [5, 4] },
        },
        {
          key: "measurement-label-background",
          type: "rect",
          attrs: { x: labelX, y: labelY, width: labelWidth, height: labelHeight },
          styles: { style: "fill", color },
        },
        {
          key: "measurement-label",
          type: "text",
          attrs: {
            x: labelX + labelWidth / 2,
            y: labelY + labelHeight / 2,
            text: label,
            align: "center",
            baseline: "middle",
          },
          styles: {
            color: "#ffffff",
            size: 12,
            weight: 600,
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            borderSize: 0,
            backgroundColor: "rgba(0, 0, 0, 0)",
          },
        },
      ];
    },
  };
}
