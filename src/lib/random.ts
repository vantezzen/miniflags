import { PRESETS } from "./encoder/parts/Palette";
import type { LayerDefinition } from "./encoder/parts/layers/types";
import type { Context } from "./types";

const ASPECT_RATIOS: readonly [number, number][] = [
  [2, 3],
  [2, 3],
  [2, 3],
  [1, 2],
  [3, 5],
  [5, 8],
];

const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const shuffle = <T>(items: readonly T[]): T[] =>
  [...items].sort(() => Math.random() - 0.5);

/** Generate a random, plausible-looking flag in decoded form. */
export function generateRandomFlag(): Context {
  const [height, width] = pick(ASPECT_RATIOS);
  const colorCount = pick([2, 3, 3, 3, 4]);
  const palette = shuffle(PRESETS)
    .slice(0, colorCount)
    .map((preset) => preset.color);
  const last = colorCount - 1;

  const direction = pick(["horizontal", "horizontal", "vertical"] as const);
  const base: LayerDefinition = pick<LayerDefinition>([
    // Equal stripes using the whole palette (Germany, France).
    {
      kind: "stripes",
      direction,
      stripes: palette.map((_, color) => ({ color })),
    },
    // ABA stripes (Austria, Spain-like).
    {
      kind: "stripes",
      direction,
      stripes: [0, 1, 0].map((color) => ({ color, weight: 1 })),
    },
    {
      kind: "stripes",
      direction,
      stripes: [1, 2, 1].map((weight, i) => ({ color: i % 2, weight })),
    },
    // Solid field for a charge to sit on.
    { kind: "stripes", direction: "horizontal", stripes: [{ color: 0 }] },
  ]);

  const addition: LayerDefinition | undefined = pick<
    LayerDefinition | undefined
  >([
    undefined,
    undefined,
    { kind: "region", color: last, region: { type: "hoist-triangle" } },
    { kind: "region", color: last, region: { type: "canton" } },
    { kind: "shape", shape: { type: "star" }, color: last },
    { kind: "shape", shape: { type: "disc" }, color: last },
    { kind: "shape", shape: { type: "crescent" }, color: last },
    { kind: "cross", style: "nordic", color: last },
    {
      kind: "band",
      direction: pick(["slash", "backslash"] as const),
      color: last,
    },
  ]);

  return {
    aspectRatio: {
      kind: "rational",
      height: BigInt(height),
      width: BigInt(width),
    },
    palette,
    layers: addition ? [base, addition] : [base],
  };
}
