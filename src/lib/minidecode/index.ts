type Scope = { x: number; y: number; w: number; h: number; clip?: string };

const COLOR_CODES_PER_LENGTH = [0, 2, 3, 1, 2];
const COLORS = [
  "#d21034",
  "#fff",
  "#0038a8",
  "#fcd116",
  "#009b3a",
  "#000",
  "" /* custom */,
  "#ff8200",
];

const RATIO_CODES_PER_LENGTH = [1, 1, 0, 1, 1, 3, 10, 7, 2];
const RATIOS = [
  3 / 2,
  2 / 1,
  5 / 3,
  8 / 5,
  19 / 10,
  4 / 3,
  7 / 4,
  1 / 1,
  10 / 7,
  11 / 8,
  18 / 11,
  20 / 11,
  28 / 11,
  25 / 18,
  1.618034,
  5 / 4,
  7 / 6,
  17 / 10,
  15 / 13,
  22 / 15,
  25 / 16,
  335 / 189,
  37 / 28,
  7 / 5,
  11 / 7,
];

const SHAPE_GEOMETRY = [
  "",
  '<circle r=".5"/>',
  '<path d="M.325-.379967A.5 .5 0 1 0 .325 .379967A.4 .4 0 1 1 .325-.379967Z"/>',
  "",
  '<path d="M0-.5L.5 0L0 .5L-.5 0Z"/>',
];
const CROSS_GEOMETRY = [
  "M-.166667-.5H.166667V-.166667H.5V.166667H.166667V.5H-.166667V.166667H-.5V-.166667H-.166667Z",
  "M-.15-.5H.15V-.15H.5V.15H.15V.5H-.15V.15H-.5V-.15H-.15Z",
  "M-.26-.5H.26L.12-.12.5-.26V.26L.12.12.26.5H-.26L-.12.12-.5.26V-.26L-.12-.12Z",
];
const SHAPE_SIZE = [0.36, 0.46, 0.46, 0.42, 0.34, 0.6];

const n = (value: number) => String(+value.toFixed(6));

const rect = (x: number, y: number, w: number, h: number, fill = "") =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${fill && ` fill="${fill}"`}/>`;

const polygon = (points: number[][], fill = "") =>
  `<polygon points="${points.map((p) => p.map(n)).join(" ")}"${fill && ` fill="${fill}"`}/>`;

const diagonal = (s: Scope, backslash: number, width: number, stroke: string) =>
  `<line x1="${n(s.x)}" y1="${n(backslash ? s.y : s.y + s.h)}" x2="${n(s.x + s.w)}" y2="${n(backslash ? s.y + s.h : s.y)}" stroke="${stroke}" stroke-width="${n(width)}"/>`;

const box = (x: number, y: number, w: number, h: number): Scope => ({
  x,
  y,
  w,
  h,
  clip: rect(x, y, w, h),
});

const polygonScope = (points: number[][]): Scope => {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    x,
    y,
    w: Math.max(...xs) - x,
    h: Math.max(...ys) - y,
    clip: polygon(points),
  };
};

const hex = (channels: number[]) =>
  "#" +
  channels
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")
    .replace(/^(.)\1(.)\2(.)\3$/, "$1$2$3");

export default function decodeMiniFlag(code: string): string {
  let rank = 0n;
  for (const char of code) rank = rank * 94n + BigInt(char.charCodeAt(0) - 33);
  // The Base94 rank orders bit strings by length, so rank + 1 is "1" followed by the payload bits
  const bits = (rank + 1n).toString(2).slice(1);
  let position = 0;

  const bit = () => +bits[position++];
  const uint = (count: number) => {
    let value = 0;
    while (count-- > 0) value = value * 2 + bit();
    return value;
  };
  const unit = () => uint(5) / 31;
  const angle = () => uint(4) / 16;
  const gamma = () => {
    let zeros = 0;
    while (!bit()) zeros++;
    return 2 ** zeros + uint(zeros);
  };
  const ones = (max: number) => {
    let count = 0;
    while (count < max && bit()) count++;
    return count;
  };
  const choice = (values: number[], escapeBase = 0) => {
    const index = ones(values.length);
    return index < values.length ? values[index] : escapeBase + gamma();
  };
  const huffman = <T>(codesPerLength: number[], values: T[]) => {
    let value = 0;
    let first = 0;
    let index = 0;
    for (const count of codesPerLength) {
      value = value * 2 + bit();
      if (value - first < count) return values[index + value - first];
      index += count;
      first = (first + count) * 2;
    }
  };
  const color = () => {
    const size = palette.length;
    const width = Math.ceil(Math.log2(size));
    const cutoff = 2 ** width - size;
    const value = uint(width - 1);
    return palette[
      !width ? 0 : value < cutoff ? value : value * 2 + bit() - cutoff
    ];
  };
  const optionalColor = () => (bit() ? color() : "");

  let W = huffman(RATIO_CODES_PER_LENGTH, RATIOS)!;
  if (!W) {
    const h = gamma();
    W = (h + gamma() - 1) / h;
  }

  const palette: string[] = [];
  for (let i = choice([3, 2, 4, 5, 1, 6, 7], 7); i--;) {
    palette.push(
      huffman(COLOR_CODES_PER_LENGTH, COLORS) ||
        hex([
          Math.round((uint(3) * 255) / 7),
          Math.round((uint(4) * 255) / 15),
          Math.round((uint(3) * 255) / 7),
        ]),
    );
  }

  const flag: Scope = { x: 0, y: 0, w: W, h: 1 };
  let region = flag;
  let clipCount = 0;
  let svg = "";

  const clip = (scope: Scope, content: string) => {
    if (!scope.clip) return content;
    const id = `c${rank.toString(36)}_${clipCount++}`;
    return `<clipPath id="${id}">${scope.clip}</clipPath><g clip-path="url(#${id})">${content}</g>`;
  };
  const scopeBit = () => (bit() ? region : flag);
  const minSide = (s: Scope) => Math.min(s.w, s.h);

  for (let i = choice([1, 2, 3, 4, 5, 6], 6); i--;) {
    const type = ones(6); // stripes, shape, region, cross, band, builtin, extension

    if (type == 0) {
      const mode = ones(9);
      const vertical = mode != 1 && bit();
      let stripes: [string, number][];

      if (mode == 0) {
        stripes = palette.map((fill): [string, number] => [fill, 1]);
      } else if (mode == 6) {
        const count = choice([13, 14, 9, 11]);
        stripes = Array.from({ length: count }, (_, i): [string, number] => [
          palette[i & 1],
          1,
        ]);
      } else if (mode > 7) {
        stripes = Array.from({ length: gamma() }, (): [string, number] => [
          color(),
          mode > 8 ? gamma() : 1,
        ]);
      } else {
        const [colors, weights] = [
          "",
          "0",
          "01",
          "010",
          "010 121",
          "01210 11211",
          "",
          "010 212",
        ][mode].split(" ");
        stripes = [...colors].map((c, i): [string, number] => [
          palette[+c],
          weights ? +weights[i] : 1,
        ]);
      }

      const total = stripes.reduce((sum, [, weight]) => sum + weight, 0);
      let start = 0;
      for (const [fill, weight] of stripes) {
        const from = start / total;
        const to = (start += weight) / total;
        svg += vertical
          ? rect(from * W, 0, (to - from) * W, 1, fill)
          : rect(0, from, W, to - from, fill);
      }
    } else if (type == 1) {
      const shape = ones(5); // star, disc, crescent, sun, diamond, cross
      let geometry = SHAPE_GEOMETRY[shape];
      if (shape == 5) {
        geometry = `<path d="${CROSS_GEOMETRY[ones(2)]}"/>`;
      } else if (shape == 0 || shape == 3) {
        const count = shape
          ? choice([12, 16, 24, 32])
          : choice([5, 6, 4, 7, 8, 12]);
        const inner = 0.5 * (shape ? 0.72 : count == 5 ? 0.382 : 0.45);
        const points: number[][] = [];
        for (let i = 0; i < count * 2; i++) {
          const r = i % 2 ? inner : 0.5;
          const a = -Math.PI / 2 + (i * Math.PI) / count;
          points.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
        geometry = polygon(points);
      }

      const fill = color();
      const border = optionalColor();
      const stroke =
        border &&
        ` stroke="${border}" stroke-width=".08" stroke-linejoin="round"`;
      const placement = ones(5); // center, custom, ring, us50, grid, points
      const scope =
        placement == 0 ? flag : placement == 3 ? region : scopeBit();
      const m = minSide(scope);
      const defaultSize = SHAPE_SIZE[shape];

      const instances: number[][] = [];
      const add = (fx: number, fy: number, size: number, rotation = 0) =>
        instances.push([
          scope.x + fx * scope.w,
          scope.y + fy * scope.h,
          size,
          rotation,
        ]);

      if (placement == 0) {
        add(0.5, 0.5, m * defaultSize);
      } else if (placement == 1) {
        const mask = uint(3);
        add(
          mask & 4 ? unit() : 0.5,
          mask & 4 ? unit() : 0.5,
          m * (mask & 2 ? unit() : defaultSize),
          mask & 1 ? angle() : 0,
        );
      } else if (placement == 2) {
        const count = choice([12, 10]);
        const custom = bit();
        const cx = custom ? unit() : 0.5;
        const cy = custom ? unit() : 0.5;
        const radius = m * (custom ? unit() : 0.32);
        const start = -Math.PI / 2 + (custom ? angle() : 0) * 2 * Math.PI;
        const size = Math.min(
          m * 0.15,
          ((2 * Math.PI * radius) / count) * 0.85,
        );
        for (let i = 0; i < count; i++) {
          const a = start + (i / count) * 2 * Math.PI;
          add(
            cx + (Math.cos(a) * radius) / scope.w,
            cy + (Math.sin(a) * radius) / scope.h,
            size,
          );
        }
      } else if (placement == 3) {
        for (let row = 0; row < 9; row++) {
          const count = row % 2 ? 5 : 6;
          for (let column = 0; column < count; column++) {
            add(
              count == 6 ? (2 * column + 1) / 12 : (column + 1) / 6,
              (row + 1) / 10,
              m * 0.1,
            );
          }
        }
      } else if (placement == 4) {
        const rows = gamma();
        const columns = gamma();
        const custom = bit();
        const bx = custom ? unit() : 0;
        const by = custom ? unit() : 0;
        const bw = custom ? unit() : 1;
        const bh = custom ? unit() : 1;
        const size =
          Math.min((bw * scope.w) / columns, (bh * scope.h) / rows) * 0.55;
        for (let row = 0; row < rows; row++) {
          for (let column = 0; column < columns; column++) {
            add(
              bx + ((column + 0.5) * bw) / columns,
              by + ((row + 0.5) * bh) / rows,
              size,
            );
          }
        }
      } else {
        const count = gamma();
        const pointSize = bit() ? unit() : 0.1;
        for (let i = 0; i < count; i++) {
          add(
            unit(),
            unit(),
            m * (bit() ? unit() : pointSize),
            bit() ? angle() : 0,
          );
        }
      }

      svg += clip(
        scope,
        instances
          .map(
            ([x, y, size, rotation]) =>
              `<g transform="translate(${n(x)} ${n(y)})${rotation ? ` rotate(${n(rotation * 360)})` : ""} scale(${n(size)})" fill="${fill}"${stroke}>${geometry}</g>`,
          )
          .join(""),
      );
    } else if (type == 2) {
      const kind = ones(5); // hoist triangle, canton, diagonal half, center rect, rectangle, triangle
      const fill = color();
      let points: number[][];

      if (kind == 0) {
        const custom = bit();
        points = [
          [0, 0],
          [(custom ? unit() : 1 / 3) * W, custom ? unit() : 0.5],
          [0, 1],
        ];
      } else if (kind == 2) {
        // Which flag corner the half-plane triangle leaves out, by direction and side bit
        const omitted = [2, 0, 3, 1][bit() * 2 + bit()];
        points = [
          [0, 0],
          [W, 0],
          [W, 1],
          [0, 1],
        ].filter((_, i) => i != omitted);
      } else if (kind == 5) {
        points = [0, 0, 0].map(() => [unit() * W, unit()]);
      } else {
        const explicit = kind == 4;
        const custom = explicit || bit();
        let x = explicit ? unit() : 0;
        let y = explicit ? unit() : 0;
        const w = custom ? unit() : 0.5;
        const h = custom ? unit() : 0.5;
        if (kind == 3) {
          x = (1 - w) / 2;
          y = (1 - h) / 2;
        }
        points = [
          [x, y],
          [x + w, y],
          [x + w, y + h],
          [x, y + h],
        ].map(([px, py]) => [px * W, py]);
      }

      svg += polygon(points, fill);
      region = polygonScope(points);
    } else if (type == 3) {
      const style = ones(4); // nordic, centered, centered in region, saltire, saltire in region
      const fill = color();
      const border = optionalColor();
      const custom = bit();
      const width = custom ? unit() : 0.12;
      const offset = !style && custom ? unit() : 1 / 3;
      const scope = style == 2 || style == 4 ? region : flag;
      const w = minSide(scope) * width;

      const cross = (stroke: string, width: number) =>
        style > 2
          ? diagonal(scope, 0, width, stroke) +
            diagonal(scope, 1, width, stroke)
          : rect(
              scope.x,
              scope.y + (scope.h - width) / 2,
              scope.w,
              width,
              stroke,
            ) +
            rect(
              scope.x + scope.w * (style ? 0.5 : offset) - width / 2,
              scope.y,
              width,
              scope.h,
              stroke,
            );

      svg += clip(scope, (border && cross(border, w * 1.5)) + cross(fill, w));
    } else if (type == 4) {
      const direction = ones(3); // slash, backslash, horizontal, vertical
      const fill = color();
      const border = optionalColor();
      const w = (direction == 3 ? W : 1) * (bit() ? unit() : 0.2);

      const band = (stroke: string, width: number) =>
        direction == 2
          ? rect(0, (1 - width) / 2, W, width, stroke)
          : direction == 3
            ? rect((W - width) / 2, 0, width, 1, stroke)
            : diagonal(flag, direction, width, stroke);

      svg += (border && band(border, w * 1.5)) + band(fill, w);
    } else if (type == 5) {
      let mode = ones(4); // union jack: full, canton, previous region, rectangle; generic builtin
      if (mode == 4) {
        gamma(); // builtin id, only the Union Jack exists
        mode = ones(3);
      }
      const s =
        mode == 0
          ? flag
          : mode == 1
            ? box(0, 0, W / 2, 0.5)
            : mode == 2
              ? region
              : box(unit() * W, unit(), unit() * W, unit());
      const blue = "#012169";
      const white = "#fff";
      const red = "#c8102e";

      svg += clip(
        s,
        rect(s.x, s.y, s.w, s.h, blue) +
          diagonal(s, 0, s.h * 0.18, white) +
          diagonal(s, 1, s.h * 0.18, white) +
          diagonal(s, 0, s.h * 0.075, red) +
          diagonal(s, 1, s.h * 0.075, red) +
          rect(s.x, s.y + s.h * 0.4, s.w, s.h * 0.2, white) +
          rect(s.x + s.w * 0.45, s.y, s.w * 0.1, s.h, white) +
          rect(s.x, s.y + s.h * 0.44, s.w, s.h * 0.12, red) +
          rect(s.x + s.w * 0.47, s.y, s.w * 0.06, s.h, red),
      );
    } else {
      gamma(); // skip unknown extension: type id, then payload length + 1
      position += gamma() - 1;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(W)} 1">${svg}</svg>`;
}
