const FIBONACCI_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export function createFiniteFibonacciOverlay() {
  return {
    name: "finiteFibonacciLine",
    totalStep: 3,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: ({ coordinates }) => {
      if (coordinates.length !== 2) return [];

      const [start, end] = coordinates;
      const labelOnRight = end.x >= start.x;
      return FIBONACCI_LEVELS.flatMap((ratio) => {
        const y = start.y + (end.y - start.y) * ratio;
        const percentage = `${(ratio * 100).toFixed(ratio === 0 || ratio === 1 ? 0 : 1)}%`;
        return [
          {
            key: `fib-line-${ratio}`,
            type: "line",
            attrs: { coordinates: [{ x: start.x, y }, { x: end.x, y }] },
            styles: { color: "#2563eb", size: 1 },
          },
          {
            key: `fib-label-${ratio}`,
            type: "text",
            attrs: {
              x: end.x + (labelOnRight ? -4 : 4),
              y,
              text: percentage,
              align: labelOnRight ? "right" : "left",
              baseline: "bottom",
            },
            styles: {
              color: "#010a00",
              size: 11,
              paddingLeft: 2,
              paddingRight: 2,
              paddingTop: 1,
              paddingBottom: 1,
              borderSize: 0,
              backgroundColor: "rgba(255, 255, 255, 0.75)",
            },
          },
        ];
      });
    },
  };
}
