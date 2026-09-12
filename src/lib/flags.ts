import type { Context, Color } from "./types";
import type {
  CrossShapeStyle,
  LayerDefinition,
  ShapePoint,
} from "./encoder/parts/layers/types";

export type Fidelity = "high" | "approx";

export interface FlagFixture {
  readonly code: string;
  readonly country: string;
  readonly fidelity: Fidelity;
  readonly note?: string;
  readonly context: Context;
}

const RED: Color = { r: 0xd2, g: 0x10, b: 0x34 };
const WHITE: Color = { r: 0xff, g: 0xff, b: 0xff };
const BLUE: Color = { r: 0x00, g: 0x38, b: 0xa8 };
const YELLOW: Color = { r: 0xfc, g: 0xd1, b: 0x16 };
const GREEN: Color = { r: 0x00, g: 0x9b, b: 0x3a };
const BLACK: Color = { r: 0x00, g: 0x00, b: 0x00 };
const ORANGE: Color = { r: 0xff, g: 0x82, b: 0x00 };

const SKY: Color = { r: 0x42, g: 0xb8, b: 0xe6 };
const LIGHT_BLUE: Color = { r: 0x6c, g: 0xac, b: 0xde };
const AQUA: Color = { r: 0x00, g: 0xab, b: 0xd2 };
const MAROON: Color = { r: 0x9e, g: 0x30, b: 0x34 };
const DARK_BLUE: Color = { r: 0x00, g: 0x2b, b: 0x7f };

const ratio = (height: number, width: number): Context["aspectRatio"] => ({
  kind: "rational",
  height: BigInt(height),
  width: BigInt(width),
});
const phi: Context["aspectRatio"] = { kind: "phi" };

const stripes = (
  direction: "horizontal" | "vertical",
  colors: readonly number[],
  weights?: readonly number[],
): LayerDefinition => ({
  kind: "stripes",
  direction,
  stripes: colors.map((color, i) => ({
    color,
    ...(weights ? { weight: weights[i] } : {}),
  })),
});
const solid = (): LayerDefinition => stripes("horizontal", [0]);
const rect = (
  color: number,
  x: number,
  y: number,
  width: number,
  height: number,
): LayerDefinition => ({
  kind: "region",
  color,
  region: { type: "rectangle", x, y, width, height },
});
const canton = (
  color: number,
  width?: number,
  height?: number,
): LayerDefinition => ({
  kind: "region",
  color,
  region: {
    type: "canton",
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
  },
});
const hoistTriangle = (
  color: number,
  apexX?: number,
  apexY?: number,
): LayerDefinition => ({
  kind: "region",
  color,
  region: {
    type: "hoist-triangle",
    ...(apexX === undefined ? {} : { apexX }),
    ...(apexY === undefined ? {} : { apexY }),
  },
});
const triangle = (
  color: number,
  points: readonly [ShapePoint, ShapePoint, ShapePoint],
): LayerDefinition => ({
  kind: "region",
  color,
  region: { type: "triangle", points },
});
const diagonalHalf = (
  color: number,
  direction: "slash" | "backslash",
  side: 0 | 1,
): LayerDefinition => ({
  kind: "region",
  color,
  region: { type: "diagonal-half", direction, side },
});
const band = (
  direction: "horizontal" | "vertical" | "slash" | "backslash",
  color: number,
  width?: number,
  borderColor?: number,
): LayerDefinition => ({
  kind: "band",
  direction,
  color,
  ...(width === undefined ? {} : { width }),
  ...(borderColor === undefined ? {} : { borderColor }),
});
const star = (
  color: number,
  placement: any = { type: "center" },
  points = 5,
  borderColor?: number,
): LayerDefinition => ({
  kind: "shape",
  shape: { type: "star", points },
  color,
  ...(borderColor === undefined ? {} : { borderColor }),
  placement,
});
const disc = (
  color: number,
  placement: any = { type: "center" },
): LayerDefinition => ({
  kind: "shape",
  shape: { type: "disc" },
  color,
  placement,
});
const crescent = (
  color: number,
  placement: any = { type: "center" },
): LayerDefinition => ({
  kind: "shape",
  shape: { type: "crescent" },
  color,
  placement,
});
const crossShape = (
  color: number,
  placement: any = { type: "center" },
  style: CrossShapeStyle = "greek",
): LayerDefinition => ({
  kind: "shape",
  shape: { type: "cross", style },
  color,
  placement,
});
const sun = (
  color: number,
  rays: number,
  placement: any = { type: "center" },
): LayerDefinition => ({
  kind: "shape",
  shape: { type: "sun", rays },
  color,
  placement,
});
const diamondPoints = (
  color: number,
  points: readonly ShapePoint[],
): LayerDefinition => ({
  kind: "shape",
  shape: { type: "diamond" },
  color,
  placement: { type: "points", points },
});
const starsAt = (
  color: number,
  points: number,
  positions: readonly ShapePoint[],
  borderColor?: number,
): LayerDefinition => ({
  kind: "shape",
  shape: { type: "star", points },
  color,
  ...(borderColor === undefined ? {} : { borderColor }),
  placement: { type: "points", points: positions },
});
const cross = (
  style: any,
  color: number,
  borderColor?: number,
  width?: number,
  offset?: number,
): LayerDefinition => ({
  kind: "cross",
  style,
  color,
  ...(borderColor === undefined ? {} : { borderColor }),
  ...(width === undefined ? {} : { width }),
  ...(offset === undefined ? {} : { offset }),
});
const unionJack = (placement: any = { type: "full" }): LayerDefinition => ({
  kind: "builtin",
  builtin: "union-jack",
  placement,
});

function f(
  code: string,
  country: string,
  fidelity: Fidelity,
  context: Context,
  note?: string,
): FlagFixture {
  return { code, country, fidelity, context, ...(note ? { note } : {}) };
}

export const FLAGS: readonly FlagFixture[] = [
  f(
    "DZ",
    "Algeria",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [GREEN, WHITE, RED],
      layers: [
        stripes("vertical", [0, 1]),
        crescent(2, { type: "custom", size: 0.5 }),
        star(2, { type: "custom", x: 0.57, y: 0.5, size: 0.25 }),
      ],
    },
    "Generic crescent geometry; star is positioned in the crescent opening.",
  ),
  f("AM", "Armenia", "high", {
    aspectRatio: ratio(1, 2),
    palette: [RED, BLUE, ORANGE],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f("AT", "Austria", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, WHITE],
    layers: [stripes("horizontal", [0, 1, 0])],
  }),
  f(
    "AZ",
    "Azerbaijan",
    "approx",
    {
      aspectRatio: ratio(1, 2),
      palette: [BLUE, RED, GREEN, WHITE],
      layers: [
        stripes("horizontal", [0, 1, 2]),
        crescent(3, { type: "custom", size: 0.28 }),
        star(3, { type: "custom", x: 0.56, y: 0.5, size: 0.12 }, 8),
      ],
    },
    "Generic crescent.",
  ),
  f("BS", "Bahamas", "high", {
    aspectRatio: ratio(1, 2),
    palette: [AQUA, YELLOW, BLACK],
    layers: [stripes("horizontal", [0, 1, 0]), hoistTriangle(2, 0.38, 0.5)],
  }),
  f("BD", "Bangladesh", "high", {
    aspectRatio: ratio(3, 5),
    palette: [GREEN, RED],
    layers: [
      solid(),
      disc(1, { type: "custom", x: 0.45, y: 0.5, size: 2 / 3 }),
    ],
  }),
  f("BE", "Belgium", "high", {
    aspectRatio: ratio(13, 15),
    palette: [BLACK, YELLOW, RED],
    layers: [stripes("vertical", [0, 1, 2])],
  }),
  f("BJ", "Benin", "high", {
    aspectRatio: ratio(2, 3),
    palette: [YELLOW, RED, GREEN],
    layers: [stripes("horizontal", [0, 1]), rect(2, 0, 0, 0.4, 1)],
  }),
  f("BO", "Bolivia", "high", {
    aspectRatio: ratio(15, 22),
    palette: [RED, YELLOW, GREEN],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f(
    "BW",
    "Botswana",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [LIGHT_BLUE, BLACK, WHITE],
      layers: [solid(), band("horizontal", 1, 0.12, 2)],
    },
    "Band border thickness is renderer-defined.",
  ),
  f("BG", "Bulgaria", "high", {
    aspectRatio: ratio(3, 5),
    palette: [WHITE, GREEN, RED],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f("BF", "Burkina Faso", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, GREEN, YELLOW],
    layers: [stripes("horizontal", [0, 1]), star(2)],
  }),
  f(
    "BI",
    "Burundi",
    "approx",
    {
      aspectRatio: ratio(3, 5),
      palette: [GREEN, RED, WHITE],
      layers: [
        solid(),
        triangle(1, [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0.5, y: 0.5 },
        ]),
        triangle(1, [
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 0.5, y: 0.5 },
        ]),
        cross("saltire", 2),
        disc(2, { type: "custom", size: 0.34 }),
        starsAt(
          1,
          6,
          [
            { x: 0.5, y: 0.41, size: 0.07 },
            { x: 0.44, y: 0.55, size: 0.07 },
            { x: 0.56, y: 0.55, size: 0.07 },
          ],
          0,
        ),
      ],
    },
    "Generic six-point stars approximate the official outlined stars.",
  ),
  f("CV", "Cabo Verde", "high", {
    aspectRatio: ratio(10, 17),
    palette: [BLUE, WHITE, RED, YELLOW],
    layers: [
      stripes("horizontal", [0, 1, 2, 1, 0], [6, 1, 1, 1, 3]),
      star(3, { type: "ring", count: 10, x: 0.3, y: 0.58, size: 0.19 }),
    ],
  }),
  f("CM", "Cameroon", "high", {
    aspectRatio: ratio(2, 3),
    palette: [GREEN, RED, YELLOW],
    layers: [stripes("vertical", [0, 1, 2]), star(2)],
  }),
  f("CF", "Central African Republic", "high", {
    aspectRatio: ratio(3, 5),
    palette: [BLUE, WHITE, GREEN, YELLOW, RED],
    layers: [
      stripes("horizontal", [0, 1, 2, 3]),
      rect(4, 0.28, 0, 0.12, 1),
      star(3, { type: "custom", x: 0.12, y: 0.12, size: 0.16 }),
    ],
  }),
  f("TD", "Chad", "high", {
    aspectRatio: ratio(2, 3),
    palette: [BLUE, YELLOW, RED],
    layers: [stripes("vertical", [0, 1, 2])],
  }),
  f("CL", "Chile", "high", {
    aspectRatio: ratio(2, 3),
    palette: [WHITE, RED, BLUE],
    layers: [
      stripes("horizontal", [0, 1]),
      canton(2, 0.33, 0.5),
      star(0, { type: "custom", scope: "previous-region", size: 0.42 }),
    ],
  }),
  f("CN", "China", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, YELLOW],
    layers: [
      solid(),
      starsAt(1, 5, [
        { x: 0.17, y: 0.25, size: 0.2 },
        { x: 0.3, y: 0.12, size: 0.07, rotation: 0.08 },
        { x: 0.35, y: 0.22, size: 0.07, rotation: 0.03 },
        { x: 0.35, y: 0.35, size: 0.07, rotation: 0.98 },
        { x: 0.29, y: 0.43, size: 0.07, rotation: 0.93 },
      ]),
    ],
  }),
  f("CO", "Colombia", "high", {
    aspectRatio: ratio(2, 3),
    palette: [YELLOW, BLUE, RED],
    layers: [stripes("horizontal", [0, 1, 2], [2, 1, 1])],
  }),
  f(
    "KM",
    "Comoros",
    "approx",
    {
      aspectRatio: ratio(3, 5),
      palette: [YELLOW, WHITE, RED, BLUE, GREEN],
      layers: [
        stripes("horizontal", [0, 1, 2, 3]),
        hoistTriangle(4, 0.42, 0.5),
        crescent(1, { type: "custom", x: 0.15, y: 0.5, size: 0.28 }),
        starsAt(1, 5, [
          { x: 0.17, y: 0.3, size: 0.045 },
          { x: 0.17, y: 0.43, size: 0.045 },
          { x: 0.17, y: 0.57, size: 0.045 },
          { x: 0.17, y: 0.7, size: 0.045 },
        ]),
      ],
    },
    "Generic crescent.",
  ),
  f("CG", "Republic of the Congo", "high", {
    aspectRatio: ratio(2, 3),
    palette: [GREEN, RED, YELLOW],
    layers: [solid(), diagonalHalf(1, "slash", 1), band("slash", 2, 0.24)],
  }),
  f("CI", "Côte d'Ivoire", "high", {
    aspectRatio: ratio(2, 3),
    palette: [ORANGE, WHITE, GREEN],
    layers: [stripes("vertical", [0, 1, 2])],
  }),
  f("CU", "Cuba", "high", {
    aspectRatio: ratio(1, 2),
    palette: [BLUE, WHITE, RED],
    layers: [
      stripes("horizontal", [0, 1, 0, 1, 0]),
      hoistTriangle(2, 0.43, 0.5),
      star(1, { type: "custom", x: 0.14, y: 0.5, size: 0.3 }),
    ],
  }),
  f("CZ", "Czechia", "high", {
    aspectRatio: ratio(2, 3),
    palette: [WHITE, RED, BLUE],
    layers: [stripes("horizontal", [0, 1]), hoistTriangle(2, 0.5, 0.5)],
  }),
  f("DK", "Denmark", "high", {
    aspectRatio: ratio(28, 37),
    palette: [RED, WHITE],
    layers: [solid(), cross("nordic", 1, undefined, 4 / 28, 14 / 37)],
  }),
  f("CD", "DR Congo", "high", {
    aspectRatio: ratio(3, 4),
    palette: [SKY, RED, YELLOW],
    layers: [
      solid(),
      band("slash", 1, 0.2, 2),
      star(2, { type: "custom", x: 0.14, y: 0.16, size: 0.4 }),
    ],
  }),
  f("DJ", "Djibouti", "high", {
    aspectRatio: ratio(2, 3),
    palette: [LIGHT_BLUE, GREEN, WHITE, RED],
    layers: [
      stripes("horizontal", [0, 1]),
      hoistTriangle(2, 0.58, 0.5),
      star(3, { type: "custom", x: 0.19, y: 0.5, size: 0.2 }),
    ],
  }),
  f("EE", "Estonia", "high", {
    aspectRatio: ratio(7, 11),
    palette: [BLUE, BLACK, WHITE],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f("FI", "Finland", "high", {
    aspectRatio: ratio(11, 18),
    palette: [WHITE, BLUE],
    layers: [solid(), cross("nordic", 1, undefined, 3 / 11, 6.5 / 18)],
  }),
  f("FR", "France", "high", {
    aspectRatio: ratio(2, 3),
    palette: [BLUE, WHITE, RED],
    layers: [stripes("vertical", [0, 1, 2])],
  }),
  f("GA", "Gabon", "high", {
    aspectRatio: ratio(3, 4),
    palette: [GREEN, YELLOW, BLUE],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f("GM", "Gambia", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, WHITE, BLUE, GREEN],
    layers: [stripes("horizontal", [0, 1, 2, 1, 3], [6, 1, 4, 1, 6])],
  }),
  f("DE", "Germany", "high", {
    aspectRatio: ratio(3, 5),
    palette: [BLACK, RED, YELLOW],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f("GH", "Ghana", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, YELLOW, GREEN, BLACK],
    layers: [stripes("horizontal", [0, 1, 2]), star(3)],
  }),
  f("GR", "Greece", "high", {
    aspectRatio: ratio(2, 3),
    palette: [BLUE, WHITE],
    layers: [
      stripes(
        "horizontal",
        Array.from({ length: 9 }, (_, i) => i & 1),
      ),
      canton(0, 0.4, 5 / 9),
      cross("centered-in-previous-region", 1, undefined, 0.2),
    ],
  }),
  f("GN", "Guinea", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, YELLOW, GREEN],
    layers: [stripes("vertical", [0, 1, 2])],
  }),
  f("GW", "Guinea-Bissau", "high", {
    aspectRatio: ratio(1, 2),
    palette: [YELLOW, GREEN, RED, BLACK],
    layers: [
      stripes("horizontal", [0, 1]),
      rect(2, 0, 0, 1 / 3, 1),
      star(3, { type: "custom", scope: "previous-region", size: 0.4 }),
    ],
  }),
  f("GY", "Guyana", "high", {
    aspectRatio: ratio(3, 5),
    palette: [GREEN, WHITE, YELLOW, BLACK, RED],
    layers: [
      solid(),
      triangle(1, [
        { x: 0, y: 0 },
        { x: 1, y: 0.5 },
        { x: 0, y: 1 },
      ]),
      triangle(2, [
        { x: 0, y: 0.06 },
        { x: 0.95, y: 0.5 },
        { x: 0, y: 0.94 },
      ]),
      triangle(3, [
        { x: 0, y: 0.15 },
        { x: 0.58, y: 0.5 },
        { x: 0, y: 0.85 },
      ]),
      triangle(4, [
        { x: 0, y: 0.2 },
        { x: 0.53, y: 0.5 },
        { x: 0, y: 0.8 },
      ]),
    ],
  }),
  f("HN", "Honduras", "high", {
    aspectRatio: ratio(1, 2),
    palette: [BLUE, WHITE],
    layers: [
      stripes("horizontal", [0, 1, 0]),
      starsAt(0, 5, [
        { x: 0.4, y: 0.5, size: 0.07 },
        { x: 0.5, y: 0.5, size: 0.07 },
        { x: 0.6, y: 0.5, size: 0.07 },
        { x: 0.45, y: 0.4, size: 0.07 },
        { x: 0.55, y: 0.6, size: 0.07 },
      ]),
    ],
  }),
  f("HU", "Hungary", "high", {
    aspectRatio: ratio(1, 2),
    palette: [RED, WHITE, GREEN],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f("IS", "Iceland", "high", {
    aspectRatio: ratio(18, 25),
    palette: [BLUE, RED, WHITE],
    layers: [solid(), cross("nordic", 1, 2, 2 / 18, 9 / 25)],
  }),
  f("ID", "Indonesia", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, WHITE],
    layers: [stripes("horizontal", [0, 1])],
  }),
  f("IE", "Ireland", "high", {
    aspectRatio: ratio(1, 2),
    palette: [GREEN, WHITE, ORANGE],
    layers: [stripes("vertical", [0, 1, 2])],
  }),
  f(
    "IL",
    "Israel",
    "approx",
    {
      aspectRatio: ratio(8, 11),
      palette: [WHITE, BLUE],
      layers: [
        stripes("horizontal", [0, 1, 0, 1, 0], [3, 1, 8, 1, 3]),
        star(0, { type: "custom", size: 0.27 }, 6, 1),
      ],
    },
    "Six-point star primitive approximates the Star of David.",
  ),
  f("IT", "Italy", "high", {
    aspectRatio: ratio(2, 3),
    palette: [GREEN, WHITE, RED],
    layers: [stripes("vertical", [0, 1, 2])],
  }),
  f("JM", "Jamaica", "high", {
    aspectRatio: ratio(1, 2),
    palette: [BLACK, GREEN, YELLOW],
    layers: [
      solid(),
      triangle(1, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0.5, y: 0.5 },
      ]),
      triangle(1, [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 0.5, y: 0.5 },
      ]),
      cross("saltire", 2, undefined, 0.1),
    ],
  }),
  f("JP", "Japan", "high", {
    aspectRatio: ratio(2, 3),
    palette: [WHITE, RED],
    layers: [solid(), disc(1, { type: "custom", size: 0.6 })],
  }),
  f("JO", "Jordan", "high", {
    aspectRatio: ratio(1, 2),
    palette: [BLACK, WHITE, GREEN, RED],
    layers: [
      stripes("horizontal", [0, 1, 2]),
      hoistTriangle(3, 0.5, 0.5),
      star(1, { type: "custom", x: 1 / 6, y: 0.5, size: 1 / 7 }, 7),
    ],
  }),
  f("LA", "Laos", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, BLUE, WHITE],
    layers: [
      stripes("horizontal", [0, 1, 0], [1, 2, 1]),
      disc(2, { type: "custom", size: 0.4 }),
    ],
  }),
  f("LV", "Latvia", "high", {
    aspectRatio: ratio(1, 2),
    palette: [MAROON, WHITE],
    layers: [stripes("horizontal", [0, 1, 0], [2, 1, 2])],
  }),
  f("LR", "Liberia", "high", {
    aspectRatio: ratio(10, 19),
    palette: [RED, WHITE, BLUE],
    layers: [
      stripes(
        "horizontal",
        Array.from({ length: 11 }, (_, i) => i & 1),
      ),
      canton(2, 0.38, 5 / 11),
      star(1, { type: "custom", scope: "previous-region", size: 0.6 }),
    ],
  }),
  f(
    "LY",
    "Libya",
    "approx",
    {
      aspectRatio: ratio(1, 2),
      palette: [RED, BLACK, GREEN, WHITE],
      layers: [
        stripes("horizontal", [0, 1, 2]),
        crescent(3, { type: "custom", x: 0.47, y: 0.5, size: 0.24 }),
        star(3, { type: "custom", x: 0.55, y: 0.5, size: 0.1 }),
      ],
    },
    "Generic crescent.",
  ),
  f("LT", "Lithuania", "high", {
    aspectRatio: ratio(3, 5),
    palette: [YELLOW, GREEN, RED],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f("LU", "Luxembourg", "high", {
    aspectRatio: ratio(3, 5),
    palette: [RED, WHITE, LIGHT_BLUE],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f("MG", "Madagascar", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, GREEN, WHITE],
    layers: [stripes("horizontal", [0, 1]), rect(2, 0, 0, 1 / 3, 1)],
  }),
  f(
    "MW",
    "Malawi",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [BLACK, RED, GREEN],
      layers: [
        solid(),
        sun(1, 31, { type: "custom", x: 0.5, y: 1 / 3, size: 0.34 }),
        rect(1, 0, 1 / 3, 1, 1 / 3),
        rect(2, 0, 2 / 3, 1, 1 / 3),
      ],
    },
    "Generic sun, clipped procedurally by later stripes.",
  ),
  f(
    "MY",
    "Malaysia",
    "approx",
    {
      aspectRatio: ratio(1, 2),
      palette: [RED, WHITE, BLUE, YELLOW],
      layers: [
        stripes(
          "horizontal",
          Array.from({ length: 14 }, (_, i) => i & 1),
        ),
        canton(2, 0.5, 8 / 14),
        crescent(3, { type: "custom", x: 0.23, y: 0.285, size: 0.25 }),
        star(3, { type: "custom", x: 0.32, y: 0.285, size: 0.13 }, 14),
      ],
    },
    "Generic crescent; 14-point star is represented.",
  ),
  f("ML", "Mali", "high", {
    aspectRatio: ratio(2, 3),
    palette: [GREEN, YELLOW, RED],
    layers: [stripes("vertical", [0, 1, 2])],
  }),
  f(
    "MV",
    "Maldives",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [RED, GREEN, WHITE],
      layers: [
        solid(),
        {
          kind: "region",
          color: 1,
          region: { type: "center-rect", width: 0.67, height: 0.5 },
        },
        crescent(2, { type: "custom", size: 0.36 }),
      ],
    },
    "Generic crescent.",
  ),
  f(
    "MH",
    "Marshall Islands",
    "approx",
    {
      aspectRatio: ratio(10, 19),
      palette: [DARK_BLUE, ORANGE, WHITE],
      layers: [
        solid(),
        triangle(1, [
          { x: 0, y: 0.72 },
          { x: 1, y: 0.2 },
          { x: 1, y: 0.38 },
        ]),
        triangle(2, [
          { x: 0, y: 0.66 },
          { x: 1, y: 0.08 },
          { x: 1, y: 0.2 },
        ]),
        star(2, { type: "custom", x: 0.18, y: 0.2, size: 0.16 }, 24),
      ],
    },
    "Tapered diagonal rays approximated by triangles.",
  ),
  f(
    "MR",
    "Mauritania",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [RED, GREEN, YELLOW],
      layers: [
        stripes("horizontal", [0, 1, 0], [1, 3, 1]),
        crescent(2, { type: "custom", size: 0.58, rotation: 0.75 }),
        star(2, { type: "custom", x: 0.5, y: 0.31, size: 0.18 }),
      ],
    },
    "Generic crescent; orientation and 1:3:1 field proportions follow the current construction.",
  ),
  f("MU", "Mauritius", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, BLUE, YELLOW, GREEN],
    layers: [stripes("horizontal", [0, 1, 2, 3])],
  }),
  f("FM", "Micronesia", "high", {
    aspectRatio: ratio(10, 19),
    palette: [LIGHT_BLUE, WHITE],
    layers: [
      solid(),
      starsAt(1, 5, [
        { x: 0.5, y: 0.28, size: 0.2 },
        { x: 0.65, y: 0.5, size: 0.2, rotation: 0.25 },
        { x: 0.5, y: 0.72, size: 0.2, rotation: 0.5 },
        { x: 0.35, y: 0.5, size: 0.2, rotation: 0.75 },
      ]),
    ],
  }),
  f("MC", "Monaco", "high", {
    aspectRatio: ratio(4, 5),
    palette: [RED, WHITE],
    layers: [stripes("horizontal", [0, 1])],
  }),
  f(
    "MA",
    "Morocco",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [RED, GREEN],
      layers: [solid(), star(0, { type: "custom", size: 0.34 }, 5, 1)],
    },
    "Bordered five-point star approximates the green pentagram.",
  ),
  f("MM", "Myanmar", "high", {
    aspectRatio: ratio(2, 3),
    palette: [YELLOW, GREEN, RED, WHITE],
    layers: [
      stripes("horizontal", [0, 1, 2]),
      star(3, { type: "custom", size: 2 / 3 }),
    ],
  }),
  f(
    "NA",
    "Namibia",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [BLUE, GREEN, RED, WHITE, YELLOW],
      layers: [
        solid(),
        diagonalHalf(1, "slash", 1),
        band("slash", 2, 0.18, 3),
        sun(4, 12, { type: "custom", x: 0.14, y: 0.18, size: 0.19 }),
      ],
    },
    "Generic sun.",
  ),
  f("NR", "Nauru", "high", {
    aspectRatio: ratio(1, 2),
    palette: [DARK_BLUE, YELLOW, WHITE],
    layers: [
      solid(),
      rect(1, 0, 0.46, 1, 1 / 12),
      star(2, { type: "custom", x: 0.25, y: 0.71, size: 1 / 3 }, 12),
    ],
  }),
  f("NL", "Netherlands", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, WHITE, BLUE],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f("NZ", "New Zealand", "high", {
    aspectRatio: ratio(1, 2),
    palette: [DARK_BLUE, RED, WHITE],
    layers: [
      solid(),
      unionJack({ type: "canton" }),
      starsAt(
        1,
        5,
        [
          { x: 0.75, y: 0.2, size: 0.1 },
          { x: 0.849, y: 0.372, size: 1 / 12 },
          { x: 0.635, y: 0.433, size: 0.1 },
          { x: 0.75, y: 0.8, size: 7 / 60 },
        ],
        2,
      ),
    ],
  }),
  f(
    "NE",
    "Niger",
    "high",
    {
      aspectRatio: ratio(2, 3),
      palette: [ORANGE, WHITE, GREEN],
      layers: [
        stripes("horizontal", [0, 1, 2]),
        disc(0, { type: "custom", size: 0.28 }),
      ],
    },
    "Uses the common 2:3 rectangular convention; Nigerien law does not prescribe a flag ratio.",
  ),
  f("NG", "Nigeria", "high", {
    aspectRatio: ratio(1, 2),
    palette: [GREEN, WHITE],
    layers: [stripes("vertical", [0, 1, 0])],
  }),
  f("KP", "North Korea", "high", {
    aspectRatio: ratio(1, 2),
    palette: [BLUE, WHITE, RED],
    layers: [
      stripes("horizontal", [0, 1, 2, 1, 0], [6, 1, 22, 1, 6]),
      disc(1, { type: "custom", x: 1 / 3, y: 0.5, size: 0.44 }),
      star(2, { type: "custom", x: 1 / 3, y: 0.5, size: 0.3 }),
    ],
  }),
  f("NO", "Norway", "high", {
    aspectRatio: ratio(8, 11),
    palette: [RED, BLUE, WHITE],
    layers: [solid(), cross("nordic", 1, 2, 2 / 16, 8 / 22)],
  }),
  f("PW", "Palau", "high", {
    aspectRatio: ratio(5, 8),
    palette: [LIGHT_BLUE, YELLOW],
    layers: [solid(), disc(1, { type: "custom", x: 0.44, y: 0.5, size: 0.38 })],
  }),
  f("PS", "Palestine", "high", {
    aspectRatio: ratio(1, 2),
    palette: [BLACK, WHITE, GREEN, RED],
    layers: [stripes("horizontal", [0, 1, 2]), hoistTriangle(3, 0.5, 0.5)],
  }),
  f("PA", "Panama", "high", {
    aspectRatio: ratio(2, 3),
    palette: [WHITE, RED, BLUE],
    layers: [
      solid(),
      rect(1, 0.5, 0, 0.5, 0.5),
      rect(2, 0, 0.5, 0.5, 0.5),
      star(2, { type: "custom", x: 0.25, y: 0.25, size: 0.25 }),
      star(1, { type: "custom", x: 0.75, y: 0.75, size: 0.25 }),
    ],
  }),
  f(
    "PK",
    "Pakistan",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [GREEN, WHITE],
      layers: [
        solid(),
        rect(1, 0, 0, 0.25, 1),
        crescent(1, {
          type: "custom",
          x: 0.625,
          y: 0.5,
          size: 0.6,
          rotation: 0.875,
        }),
        star(1, {
          type: "custom",
          x: 0.725,
          y: 0.367,
          size: 0.2,
          rotation: 0.125,
        }),
      ],
    },
    "Generic crescent outline; official placement, scale and diagonal orientation are approximated by Unit5/Angle4.",
  ),
  f("PE", "Peru", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, WHITE],
    layers: [stripes("vertical", [0, 1, 0])],
  }),
  f(
    "PH",
    "Philippines",
    "approx",
    {
      aspectRatio: ratio(1, 2),
      palette: [BLUE, RED, WHITE, YELLOW],
      layers: [
        stripes("horizontal", [0, 1]),
        hoistTriangle(2, 0.5, 0.5),
        sun(3, 8, { type: "custom", x: 0.14, y: 0.5, size: 0.14 }),
        starsAt(3, 5, [
          { x: 0.035, y: 0.08, size: 0.055 },
          { x: 0.035, y: 0.92, size: 0.055 },
          { x: 0.43, y: 0.5, size: 0.055 },
        ]),
      ],
    },
    "Generic eight-ray sun omits detailed ray geometry.",
  ),
  f("PL", "Poland", "high", {
    aspectRatio: ratio(5, 8),
    palette: [WHITE, RED],
    layers: [stripes("horizontal", [0, 1])],
  }),
  f("RO", "Romania", "high", {
    aspectRatio: ratio(2, 3),
    palette: [BLUE, YELLOW, RED],
    layers: [stripes("vertical", [0, 1, 2])],
  }),
  f("RU", "Russia", "high", {
    aspectRatio: ratio(2, 3),
    palette: [WHITE, BLUE, RED],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f(
    "RW",
    "Rwanda",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [BLUE, YELLOW, GREEN],
      layers: [
        stripes("horizontal", [0, 1, 2], [2, 1, 1]),
        sun(1, 24, { type: "custom", x: 0.84, y: 0.22, size: 0.16 }),
      ],
    },
    "Generic 24-ray sun.",
  ),
  f("KN", "Saint Kitts and Nevis", "high", {
    aspectRatio: ratio(2, 3),
    palette: [GREEN, RED, BLACK, YELLOW, WHITE],
    layers: [
      solid(),
      diagonalHalf(1, "slash", 1),
      band("slash", 2, 0.2, 3),
      starsAt(4, 5, [
        { x: 0.32, y: 0.68, size: 0.28, rotation: 0.125 },
        { x: 0.7, y: 0.3, size: 0.28, rotation: 0.125 },
      ]),
    ],
  }),
  f("LC", "Saint Lucia", "high", {
    aspectRatio: ratio(1, 2),
    palette: [LIGHT_BLUE, WHITE, BLACK, YELLOW],
    layers: [
      solid(),
      triangle(1, [
        { x: 0.5, y: 0.18 },
        { x: 0.27, y: 0.82 },
        { x: 0.73, y: 0.82 },
      ]),
      triangle(2, [
        { x: 0.5, y: 0.24 },
        { x: 0.31, y: 0.77 },
        { x: 0.69, y: 0.77 },
      ]),
      triangle(3, [
        { x: 0.5, y: 0.48 },
        { x: 0.36, y: 0.82 },
        { x: 0.64, y: 0.82 },
      ]),
    ],
  }),
  f("VC", "Saint Vincent and the Grenadines", "high", {
    aspectRatio: ratio(2, 3),
    palette: [BLUE, YELLOW, GREEN],
    layers: [
      stripes("vertical", [0, 1, 2], [1, 2, 1]),
      diamondPoints(2, [
        { x: 0.45, y: 0.42, size: 0.2 },
        { x: 0.55, y: 0.42, size: 0.2 },
        { x: 0.5, y: 0.62, size: 0.2 },
      ]),
    ],
  }),
  f("WS", "Samoa", "high", {
    aspectRatio: ratio(1, 2),
    palette: [RED, BLUE, WHITE],
    layers: [
      solid(),
      canton(1, 0.5, 0.5),
      starsAt(2, 5, [
        { x: 0.22, y: 0.12, size: 0.06 },
        { x: 0.32, y: 0.22, size: 0.05 },
        { x: 0.22, y: 0.31, size: 0.055 },
        { x: 0.14, y: 0.22, size: 0.05 },
        { x: 0.29, y: 0.37, size: 0.035 },
      ]),
    ],
  }),
  f("ST", "São Tomé and Príncipe", "high", {
    aspectRatio: ratio(1, 2),
    palette: [GREEN, YELLOW, RED, BLACK],
    layers: [
      stripes("horizontal", [0, 1, 0], [1, 2, 1]),
      hoistTriangle(2, 0.33, 0.5),
      starsAt(3, 5, [
        { x: 0.48, y: 0.5, size: 0.1 },
        { x: 0.67, y: 0.5, size: 0.1 },
      ]),
    ],
  }),
  f("SN", "Senegal", "high", {
    aspectRatio: ratio(2, 3),
    palette: [GREEN, YELLOW, RED],
    layers: [
      stripes("vertical", [0, 1, 2]),
      star(0, { type: "custom", size: 0.16 }),
    ],
  }),
  f(
    "SC",
    "Seychelles",
    "approx",
    {
      aspectRatio: ratio(1, 2),
      palette: [BLUE, YELLOW, RED, WHITE, GREEN],
      layers: [
        solid(),
        triangle(1, [
          { x: 0, y: 1 },
          { x: 0.33, y: 0 },
          { x: 0.55, y: 0 },
        ]),
        triangle(2, [
          { x: 0, y: 1 },
          { x: 0.55, y: 0 },
          { x: 0.78, y: 0 },
        ]),
        triangle(3, [
          { x: 0, y: 1 },
          { x: 0.78, y: 0 },
          { x: 1, y: 0.38 },
        ]),
        triangle(4, [
          { x: 0, y: 1 },
          { x: 1, y: 0.38 },
          { x: 1, y: 1 },
        ]),
      ],
    },
    "Unit5 triangular decomposition approximates the official radiating polygons.",
  ),
  f("SL", "Sierra Leone", "high", {
    aspectRatio: ratio(2, 3),
    palette: [GREEN, WHITE, BLUE],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
  f(
    "SG",
    "Singapore",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [RED, WHITE],
      layers: [
        stripes("horizontal", [0, 1]),
        crescent(1, { type: "custom", x: 0.211, y: 0.25, size: 0.368 }),
        starsAt(1, 5, [
          { x: 0.278, y: 0.144, size: 0.089 },
          { x: 0.345, y: 0.217, size: 0.089 },
          { x: 0.319, y: 0.335, size: 0.089 },
          { x: 0.236, y: 0.335, size: 0.089 },
          { x: 0.211, y: 0.217, size: 0.089 },
        ]),
      ],
    },
    "Generic crescent; emblem dimensions follow the 1959 construction diagram.",
  ),
  f("SB", "Solomon Islands", "high", {
    aspectRatio: ratio(1, 2),
    palette: [BLUE, GREEN, YELLOW, WHITE],
    layers: [
      solid(),
      diagonalHalf(1, "slash", 1),
      band("slash", 2, 0.08),
      starsAt(3, 5, [
        { x: 0.1, y: 0.12, size: 0.055 },
        { x: 0.2, y: 0.12, size: 0.055 },
        { x: 0.15, y: 0.2, size: 0.055 },
        { x: 0.1, y: 0.28, size: 0.055 },
        { x: 0.2, y: 0.28, size: 0.055 },
      ]),
    ],
  }),
  f("SO", "Somalia", "high", {
    aspectRatio: ratio(2, 3),
    palette: [LIGHT_BLUE, WHITE],
    layers: [solid(), star(1, { type: "custom", size: 0.27 })],
  }),
  f("SS", "South Sudan", "high", {
    aspectRatio: ratio(1, 2),
    palette: [BLACK, WHITE, RED, GREEN, BLUE, YELLOW],
    layers: [
      stripes("horizontal", [0, 1, 2, 1, 3], [3, 1, 3, 1, 3]),
      hoistTriangle(4, 0.5, 0.5),
      star(5, { type: "custom", x: 0.14, y: 0.5, size: 0.12 }),
    ],
  }),
  f("SD", "Sudan", "high", {
    aspectRatio: ratio(1, 2),
    palette: [RED, WHITE, BLACK, GREEN],
    layers: [stripes("horizontal", [0, 1, 2]), hoistTriangle(3, 0.5, 0.5)],
  }),
  f("SR", "Suriname", "high", {
    aspectRatio: ratio(2, 3),
    palette: [GREEN, WHITE, RED, YELLOW],
    layers: [
      stripes("horizontal", [0, 1, 2, 1, 0], [2, 1, 4, 1, 2]),
      star(3, { type: "custom", size: 0.22 }),
    ],
  }),
  f("SE", "Sweden", "high", {
    aspectRatio: ratio(5, 8),
    palette: [BLUE, YELLOW],
    layers: [solid(), cross("nordic", 1, undefined, 0.2, 0.375)],
  }),
  f("CH", "Switzerland", "high", {
    aspectRatio: ratio(1, 1),
    palette: [RED, WHITE],
    layers: [solid(), crossShape(1, { type: "custom", size: 5 / 8 }, "swiss")],
  }),
  f("SY", "Syria", "high", {
    aspectRatio: ratio(2, 3),
    palette: [GREEN, WHITE, BLACK, RED],
    layers: [
      stripes("horizontal", [0, 1, 2]),
      starsAt(3, 5, [
        { x: 0.37, y: 0.5, size: 0.16 },
        { x: 0.5, y: 0.5, size: 0.16 },
        { x: 0.63, y: 0.5, size: 0.16 },
      ]),
    ],
  }),
  f("TZ", "Tanzania", "high", {
    aspectRatio: ratio(2, 3),
    palette: [GREEN, BLUE, BLACK, YELLOW],
    layers: [solid(), diagonalHalf(1, "slash", 1), band("slash", 2, 0.2, 3)],
  }),
  f("TH", "Thailand", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, WHITE, BLUE],
    layers: [stripes("horizontal", [0, 1, 2, 1, 0], [1, 1, 2, 1, 1])],
  }),
  f("TL", "Timor-Leste", "high", {
    aspectRatio: ratio(1, 2),
    palette: [RED, YELLOW, BLACK, WHITE],
    layers: [
      solid(),
      triangle(1, [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0.5, y: 0.5 },
      ]),
      triangle(2, [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0.33, y: 0.5 },
      ]),
      star(3, {
        type: "custom",
        x: 0.11,
        y: 0.5,
        size: 1 / 3,
        rotation: 0.9375,
      }),
    ],
  }),
  f("TG", "Togo", "high", {
    aspectRatio: phi,
    palette: [GREEN, YELLOW, RED, WHITE],
    layers: [
      stripes("horizontal", [0, 1, 0, 1, 0]),
      canton(2, 0.371, 0.6),
      star(3, { type: "custom", scope: "previous-region", size: 0.55 }),
    ],
  }),
  f("TO", "Tonga", "high", {
    aspectRatio: ratio(1, 2),
    palette: [RED, WHITE],
    layers: [
      solid(),
      canton(1, 14 / 32, 8 / 16),
      crossShape(
        0,
        { type: "custom", scope: "previous-region", size: 0.75 },
        "greek",
      ),
    ],
  }),
  f("TT", "Trinidad and Tobago", "high", {
    aspectRatio: ratio(3, 5),
    palette: [RED, BLACK, WHITE],
    layers: [solid(), band("backslash", 1, 0.2, 2)],
  }),
  f(
    "TN",
    "Tunisia",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [RED, WHITE],
      layers: [
        solid(),
        disc(1, { type: "custom", size: 0.5 }),
        crescent(0, { type: "custom", x: 0.48, y: 0.5, size: 0.27 }),
        star(0, { type: "custom", x: 0.56, y: 0.5, size: 0.1 }),
      ],
    },
    "Generic crescent.",
  ),
  f(
    "TR",
    "Turkey",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [RED, WHITE],
      layers: [
        solid(),
        crescent(1, { type: "custom", x: 0.4, y: 0.5, size: 0.36 }),
        star(1, { type: "custom", x: 0.53, y: 0.5, size: 0.12 }),
      ],
    },
    "Generic crescent.",
  ),
  f("TV", "Tuvalu", "high", {
    aspectRatio: ratio(1, 2),
    palette: [LIGHT_BLUE, YELLOW],
    layers: [
      solid(),
      unionJack({ type: "canton" }),
      starsAt(1, 5, [
        { x: 0.62, y: 0.2, size: 0.045 },
        { x: 0.76, y: 0.26, size: 0.045 },
        { x: 0.86, y: 0.38, size: 0.045 },
        { x: 0.78, y: 0.5, size: 0.045 },
        { x: 0.88, y: 0.62, size: 0.045 },
        { x: 0.72, y: 0.7, size: 0.045 },
        { x: 0.58, y: 0.64, size: 0.045 },
        { x: 0.61, y: 0.48, size: 0.045 },
        { x: 0.54, y: 0.34, size: 0.045 },
      ]),
    ],
  }),
  f("AE", "United Arab Emirates", "high", {
    aspectRatio: ratio(1, 2),
    palette: [GREEN, WHITE, BLACK, RED],
    layers: [stripes("horizontal", [0, 1, 2]), rect(3, 0, 0, 0.25, 1)],
  }),
  f("GB", "United Kingdom", "high", {
    aspectRatio: ratio(1, 2),
    palette: [BLUE, WHITE, RED],
    layers: [unionJack()],
  }),
  f("UA", "Ukraine", "high", {
    aspectRatio: ratio(2, 3),
    palette: [BLUE, YELLOW],
    layers: [stripes("horizontal", [0, 1])],
  }),
  f(
    "UY",
    "Uruguay",
    "approx",
    {
      aspectRatio: ratio(2, 3),
      palette: [WHITE, BLUE, YELLOW],
      layers: [
        stripes(
          "horizontal",
          Array.from({ length: 9 }, (_, i) => i & 1),
        ),
        canton(0, 0.45, 5 / 9),
        sun(2, 32, { type: "custom", scope: "previous-region", size: 0.6 }),
      ],
    },
    "Generic 32-ray sun omits the Sun of May face.",
  ),
  f("US", "United States", "high", {
    aspectRatio: ratio(10, 19),
    palette: [RED, WHITE, BLUE],
    layers: [
      stripes(
        "horizontal",
        Array.from({ length: 13 }, (_, i) => i & 1),
      ),
      canton(2, 0.4, 7 / 13),
      star(1, { type: "us50" }),
    ],
  }),
  f("VN", "Vietnam", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, YELLOW],
    layers: [solid(), star(1, { type: "custom", size: 0.6 })],
  }),
  f(
    "AR",
    "Argentina",
    "approx",
    {
      aspectRatio: ratio(5, 8),
      palette: [SKY, WHITE, YELLOW],
      layers: [
        stripes("horizontal", [0, 1, 0]),
        sun(2, 32, { type: "custom", size: 0.23 }),
      ],
    },
    "Generic 32-ray sun omits the Sun of May face.",
  ),
  f("AU", "Australia", "high", {
    aspectRatio: ratio(1, 2),
    palette: [DARK_BLUE, WHITE],
    layers: [
      solid(),
      unionJack({ type: "canton" }),
      starsAt(1, 7, [
        { x: 0.25, y: 0.72, size: 0.16 },
        { x: 0.72, y: 0.22, size: 0.09 },
        { x: 0.82, y: 0.42, size: 0.09 },
        { x: 0.7, y: 0.55, size: 0.09 },
        { x: 0.61, y: 0.38, size: 0.09 },
      ]),
      star(1, { type: "custom", x: 0.8, y: 0.65, size: 0.065 }, 5),
    ],
  }),
  f("BH", "Bahrain", "high", {
    aspectRatio: ratio(3, 5),
    palette: [RED, WHITE],
    layers: [
      solid(),
      rect(1, 0, 0, 0.24, 1),
      ...Array.from(
        { length: 5 },
        (_, i) =>
          triangle(1, [
            { x: 0.24, y: i / 5 },
            { x: 0.34, y: (i + 0.5) / 5 },
            { x: 0.24, y: (i + 1) / 5 },
          ]) as LayerDefinition,
      ),
    ],
  }),
  f("BA", "Bosnia and Herzegovina", "high", {
    aspectRatio: ratio(1, 2),
    palette: [BLUE, YELLOW, WHITE],
    layers: [
      solid(),
      triangle(1, [
        { x: 0.265, y: 0 },
        { x: 0.765, y: 0 },
        { x: 0.765, y: 1 },
      ]),
      starsAt(2, 5, [
        { x: 0.175, y: 0, size: 0.213 },
        { x: 0.238, y: 0.125, size: 0.213 },
        { x: 0.3, y: 0.25, size: 0.213 },
        { x: 0.363, y: 0.375, size: 0.213 },
        { x: 0.425, y: 0.5, size: 0.213 },
        { x: 0.488, y: 0.625, size: 0.213 },
        { x: 0.55, y: 0.75, size: 0.213 },
        { x: 0.613, y: 0.875, size: 0.213 },
        { x: 0.675, y: 1, size: 0.213 },
      ]),
    ],
  }),
  f(
    "ET",
    "Ethiopia",
    "approx",
    {
      aspectRatio: ratio(1, 2),
      palette: [GREEN, YELLOW, RED, BLUE],
      layers: [
        stripes("horizontal", [0, 1, 2]),
        disc(3, { type: "custom", size: 0.38 }),
        star(3, { type: "custom", size: 0.24 }, 5, 1),
      ],
    },
    "Generic bordered star approximates the radiating pentagram emblem.",
  ),
  f("GE", "Georgia", "high", {
    aspectRatio: ratio(2, 3),
    palette: [WHITE, RED],
    layers: [
      solid(),
      cross("centered", 1, undefined, 0.2),
      crossShape(
        1,
        {
          type: "points",
          points: [
            { x: 0.167, y: 0.25, size: 0.2 },
            { x: 0.833, y: 0.25, size: 0.2 },
            { x: 0.167, y: 0.75, size: 0.2 },
            { x: 0.833, y: 0.75, size: 0.2 },
          ],
        },
        "bolnisi",
      ),
    ],
  }),
  f("KW", "Kuwait", "high", {
    aspectRatio: ratio(1, 2),
    palette: [GREEN, WHITE, RED, BLACK],
    layers: [
      stripes("horizontal", [0, 1, 2]),
      triangle(3, [
        { x: 0, y: 0 },
        { x: 0.25, y: 1 / 3 },
        { x: 0, y: 1 / 3 },
      ]),
      rect(3, 0, 1 / 3, 0.25, 1 / 3),
      triangle(3, [
        { x: 0, y: 2 / 3 },
        { x: 0.25, y: 2 / 3 },
        { x: 0, y: 1 },
      ]),
    ],
  }),
  f(
    "MK",
    "North Macedonia",
    "approx",
    {
      aspectRatio: ratio(1, 2),
      palette: [RED, YELLOW],
      layers: [
        solid(),
        triangle(1, [
          { x: 0.47, y: 0.5 },
          { x: 0, y: 0.38 },
          { x: 0, y: 0.62 },
        ]),
        triangle(1, [
          { x: 0.53, y: 0.5 },
          { x: 1, y: 0.38 },
          { x: 1, y: 0.62 },
        ]),
        triangle(1, [
          { x: 0.5, y: 0.47 },
          { x: 0.38, y: 0 },
          { x: 0.62, y: 0 },
        ]),
        triangle(1, [
          { x: 0.5, y: 0.53 },
          { x: 0.38, y: 1 },
          { x: 0.62, y: 1 },
        ]),
        triangle(1, [
          { x: 0.46, y: 0.46 },
          { x: 0, y: 0 },
          { x: 0.16, y: 0 },
        ]),
        triangle(1, [
          { x: 0.54, y: 0.46 },
          { x: 0.84, y: 0 },
          { x: 1, y: 0 },
        ]),
        triangle(1, [
          { x: 0.46, y: 0.54 },
          { x: 0, y: 1 },
          { x: 0.16, y: 1 },
        ]),
        triangle(1, [
          { x: 0.54, y: 0.54 },
          { x: 0.84, y: 1 },
          { x: 1, y: 1 },
        ]),
        disc(1, { type: "custom", size: 0.18 }),
      ],
    },
    "Ray widths are Unit5 approximations of the official sunburst.",
  ),
  f("QA", "Qatar", "high", {
    aspectRatio: ratio(11, 28),
    palette: [MAROON, WHITE],
    layers: [
      solid(),
      rect(1, 0, 0, 0.27, 1),
      ...Array.from(
        { length: 9 },
        (_, i) =>
          triangle(1, [
            { x: 0.27, y: i / 9 },
            { x: 0.35, y: (i + 0.5) / 9 },
            { x: 0.27, y: (i + 1) / 9 },
          ]) as LayerDefinition,
      ),
    ],
  }),
  f(
    "UZ",
    "Uzbekistan",
    "approx",
    {
      aspectRatio: ratio(1, 2),
      palette: [BLUE, RED, WHITE, GREEN],
      layers: [
        stripes("horizontal", [0, 1, 2, 1, 3], [12, 1, 12, 1, 12]),
        crescent(2, { type: "custom", x: 0.11, y: 0.2, size: 0.13 }),
        starsAt(2, 5, [
          { x: 0.19, y: 0.12, size: 0.025 },
          { x: 0.23, y: 0.12, size: 0.025 },
          { x: 0.27, y: 0.12, size: 0.025 },
          { x: 0.17, y: 0.18, size: 0.025 },
          { x: 0.21, y: 0.18, size: 0.025 },
          { x: 0.25, y: 0.18, size: 0.025 },
          { x: 0.29, y: 0.18, size: 0.025 },
          { x: 0.15, y: 0.24, size: 0.025 },
          { x: 0.19, y: 0.24, size: 0.025 },
          { x: 0.23, y: 0.24, size: 0.025 },
          { x: 0.27, y: 0.24, size: 0.025 },
          { x: 0.31, y: 0.24, size: 0.025 },
        ]),
      ],
    },
    "Generic crescent; thin stripe proportions are quantized.",
  ),
  f("YE", "Yemen", "high", {
    aspectRatio: ratio(2, 3),
    palette: [RED, WHITE, BLACK],
    layers: [stripes("horizontal", [0, 1, 2])],
  }),
];

export const UNSUPPORTED_CURRENT_FLAGS: readonly {
  code: string;
  country: string;
  reason: string;
}[] = [
  {
    code: "AF",
    country: "Afghanistan",
    reason: "Current flag requires Shahada text/calligraphy.",
  },
  {
    code: "AL",
    country: "Albania",
    reason: "Double-headed eagle glyph not in V1.",
  },
  {
    code: "AD",
    country: "Andorra",
    reason: "National coat of arms not in V1.",
  },
  {
    code: "AO",
    country: "Angola",
    reason: "Cogwheel/machete emblem not in V1.",
  },
  {
    code: "AG",
    country: "Antigua and Barbuda",
    reason:
      "Rising-sun/V-field construction needs a dedicated composite or more exact clipping semantics.",
  },
  {
    code: "BB",
    country: "Barbados",
    reason: "Broken trident glyph not in V1.",
  },
  {
    code: "BY",
    country: "Belarus",
    reason: "Traditional ornamental hoist pattern not in V1.",
  },
  { code: "BZ", country: "Belize", reason: "Detailed coat of arms not in V1." },
  { code: "BT", country: "Bhutan", reason: "Dragon glyph not in V1." },
  {
    code: "BR",
    country: "Brazil",
    reason: "Motto band, stars, and celestial globe details exceed V1.",
  },
  { code: "BN", country: "Brunei", reason: "National emblem not in V1." },
  { code: "KH", country: "Cambodia", reason: "Angkor Wat emblem not in V1." },
  { code: "CA", country: "Canada", reason: "Maple leaf glyph not in V1." },
  {
    code: "CR",
    country: "Costa Rica",
    reason: "Official state/national flag coat of arms not in V1.",
  },
  { code: "HR", country: "Croatia", reason: "Coat of arms/crown not in V1." },
  {
    code: "CY",
    country: "Cyprus",
    reason: "Island map and olive branches not in V1.",
  },
  {
    code: "DM",
    country: "Dominica",
    reason: "Parrot/seal and detailed star arrangement exceed V1.",
  },
  {
    code: "DO",
    country: "Dominican Republic",
    reason: "Central coat of arms not in V1.",
  },
  { code: "EC", country: "Ecuador", reason: "Coat of arms not in V1." },
  { code: "EG", country: "Egypt", reason: "Eagle of Saladin glyph not in V1." },
  { code: "SV", country: "El Salvador", reason: "Coat of arms not in V1." },
  {
    code: "GQ",
    country: "Equatorial Guinea",
    reason: "Coat of arms not in V1.",
  },
  { code: "ER", country: "Eritrea", reason: "Olive wreath/emblem not in V1." },
  {
    code: "SZ",
    country: "Eswatini",
    reason: "Shield, spears and tassels not in V1.",
  },
  { code: "FJ", country: "Fiji", reason: "Shield in fly not in V1." },
  {
    code: "GD",
    country: "Grenada",
    reason: "Nutmeg emblem and border-star construction exceed V1.",
  },
  {
    code: "GT",
    country: "Guatemala",
    reason: "Quetzal/scroll/rifles emblem not in V1.",
  },
  { code: "HT", country: "Haiti", reason: "Coat of arms panel not in V1." },
  { code: "IN", country: "India", reason: "24-spoke Ashoka Chakra not in V1." },
  { code: "IQ", country: "Iraq", reason: "Takbir text not in V1." },
  {
    code: "IR",
    country: "Iran",
    reason: "Central emblem and Kufic border text not in V1.",
  },
  {
    code: "KZ",
    country: "Kazakhstan",
    reason: "Eagle and ornamental hoist pattern not in V1.",
  },
  {
    code: "KE",
    country: "Kenya",
    reason: "Maasai shield and spears not in V1.",
  },
  {
    code: "KI",
    country: "Kiribati",
    reason: "Frigatebird and wave geometry exceed V1.",
  },
  {
    code: "KG",
    country: "Kyrgyzstan",
    reason: "Tunduk detail inside sun not in V1.",
  },
  { code: "LS", country: "Lesotho", reason: "Mokorotlo hat glyph not in V1." },
  { code: "LB", country: "Lebanon", reason: "Cedar tree glyph not in V1." },
  { code: "LI", country: "Liechtenstein", reason: "Crown glyph not in V1." },
  { code: "MT", country: "Malta", reason: "George Cross emblem not in V1." },
  { code: "MX", country: "Mexico", reason: "Central coat of arms not in V1." },
  { code: "MD", country: "Moldova", reason: "Central coat of arms not in V1." },
  { code: "MN", country: "Mongolia", reason: "Soyombo glyph not in V1." },
  { code: "ME", country: "Montenegro", reason: "Coat of arms not in V1." },
  {
    code: "MZ",
    country: "Mozambique",
    reason: "Rifle/hoe/book emblem not in V1.",
  },
  {
    code: "NP",
    country: "Nepal",
    reason: "Non-rectangular flag intentionally excluded.",
  },
  { code: "NI", country: "Nicaragua", reason: "Coat of arms not in V1." },
  { code: "OM", country: "Oman", reason: "National emblem not in V1." },
  {
    code: "PG",
    country: "Papua New Guinea",
    reason: "Bird-of-paradise glyph not in V1.",
  },
  {
    code: "PY",
    country: "Paraguay",
    reason: "Distinct obverse/reverse seals not in V1.",
  },
  {
    code: "PT",
    country: "Portugal",
    reason: "Armillary sphere and shield not in V1.",
  },
  { code: "SM", country: "San Marino", reason: "Coat of arms not in V1." },
  {
    code: "SA",
    country: "Saudi Arabia",
    reason: "Shahada text and sword need text/glyph support.",
  },
  { code: "RS", country: "Serbia", reason: "Coat of arms not in V1." },
  { code: "SK", country: "Slovakia", reason: "Coat of arms not in V1." },
  { code: "SI", country: "Slovenia", reason: "Coat of arms not in V1." },
  {
    code: "ZA",
    country: "South Africa",
    reason: "Y-pall geometry deserves a dedicated layer/composite.",
  },
  {
    code: "KR",
    country: "South Korea",
    reason: "Taegeuk and trigrams not in V1.",
  },
  { code: "ES", country: "Spain", reason: "Coat of arms not in V1." },
  {
    code: "LK",
    country: "Sri Lanka",
    reason: "Lion and bo-leaf ornaments not in V1.",
  },
  { code: "TJ", country: "Tajikistan", reason: "Crown glyph not in V1." },
  {
    code: "TM",
    country: "Turkmenistan",
    reason: "Carpet-gul hoist stripe not in V1.",
  },
  {
    code: "UG",
    country: "Uganda",
    reason: "Grey crowned crane emblem not in V1.",
  },
  {
    code: "VU",
    country: "Vanuatu",
    reason: "Y-shape and boar-tusk emblem need a dedicated composite/glyph.",
  },
  {
    code: "VA",
    country: "Vatican City",
    reason: "Papal keys/tiara emblem not in V1.",
  },
  {
    code: "VE",
    country: "Venezuela",
    reason: "Current state flag includes the coat of arms; not in V1.",
  },
  { code: "ZM", country: "Zambia", reason: "Eagle glyph not in V1." },
  { code: "ZW", country: "Zimbabwe", reason: "Zimbabwe Bird glyph not in V1." },
];
