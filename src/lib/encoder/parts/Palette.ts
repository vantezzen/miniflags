import type MiniFlag from "../miniflag";
import { ProtocolPart, type Color, type Context } from "../../types";

interface PresetColor {
  readonly name: string;
  readonly code: string;
  readonly color: Color;
}

export const PRESETS: readonly PresetColor[] = [
  { name: "red", code: "00", color: { r: 0xd2, g: 0x10, b: 0x34 } },
  { name: "white", code: "01", color: { r: 0xff, g: 0xff, b: 0xff } },
  { name: "blue", code: "100", color: { r: 0x00, g: 0x38, b: 0xa8 } },
  { name: "yellow", code: "101", color: { r: 0xfc, g: 0xd1, b: 0x16 } },
  { name: "green", code: "110", color: { r: 0x00, g: 0x9b, b: 0x3a } },
  { name: "black", code: "1110", color: { r: 0x00, g: 0x00, b: 0x00 } },
  { name: "orange", code: "11111", color: { r: 0xff, g: 0x82, b: 0x00 } },
];

const CUSTOM_COLOR_CODE = "11110";
const CODE_TO_PRESET = new Map(PRESETS.map((preset) => [preset.code, preset]));
const COLOR_PREFIXES = new Set([...CODE_TO_PRESET.keys(), CUSTOM_COLOR_CODE]);

const COUNT_TO_CODE = new Map<number, string>([
  [3, "0"],
  [2, "10"],
  [4, "110"],
  [5, "1110"],
  [1, "11110"],
  [6, "111110"],
  [7, "1111110"],
]);
const CODE_TO_COUNT = new Map(
  [...COUNT_TO_CODE.entries()].map(([count, code]) => [code, count]),
);
const CUSTOM_COUNT_CODE = "1111111";

/** Squared Euclidean sRGB distance threshold for snapping to a preset. */
const PRESET_TOLERANCE_SQUARED = 48 * 48;

export class PalettePart extends ProtocolPart {
  public constructor() {
    super("palette");
  }

  public encode(io: MiniFlag, context: Readonly<Context>): void {
    if (context.palette.length < 1) {
      throw new Error("Palette must contain at least one color");
    }

    this.writeCount(io, context.palette.length);
    for (const color of context.palette) this.writeColor(io, color);
  }

  public decode(io: MiniFlag): Partial<Context> {
    const count = this.readCount(io);
    const palette = Array.from({ length: count }, () => this.readColor(io));
    return { palette };
  }

  private writeCount(io: MiniFlag, count: number): void {
    const direct = COUNT_TO_CODE.get(count);
    if (direct !== undefined) {
      io.writeBits(direct);
      return;
    }

    io.writeBits(CUSTOM_COUNT_CODE);
    io.writeGamma(BigInt(count - 7));
  }

  private readCount(io: MiniFlag): number {
    let prefix = "";
    const candidates = [...CODE_TO_COUNT.keys(), CUSTOM_COUNT_CODE];

    while (true) {
      prefix += String(io.readBit());
      const direct = CODE_TO_COUNT.get(prefix);
      if (direct !== undefined) return direct;

      if (prefix === CUSTOM_COUNT_CODE) {
        const count = io.readGamma() + 7n;
        if (count > BigInt(Number.MAX_SAFE_INTEGER))
          throw new Error("Palette is too large");
        return Number(count);
      }

      if (!candidates.some((code) => code.startsWith(prefix))) {
        throw new Error(`Invalid palette-count prefix: ${prefix}`);
      }
    }
  }

  private writeColor(io: MiniFlag, color: Color): void {
    this.validateColor(color);
    const preset = this.closestPreset(color);

    if (this.distanceSquared(color, preset.color) <= PRESET_TOLERANCE_SQUARED) {
      io.writeBits(preset.code);
      return;
    }

    io.writeBits(CUSTOM_COLOR_CODE);
    io.writeUint(this.quantize(color.r, 7), 3);
    io.writeUint(this.quantize(color.g, 15), 4);
    io.writeUint(this.quantize(color.b, 7), 3);
  }

  private readColor(io: MiniFlag): Color {
    let prefix = "";

    while (true) {
      prefix += String(io.readBit());
      const preset = CODE_TO_PRESET.get(prefix);
      if (preset !== undefined) return { ...preset.color };

      if (prefix === CUSTOM_COLOR_CODE) {
        return {
          r: this.dequantize(io.readUint(3), 7),
          g: this.dequantize(io.readUint(4), 15),
          b: this.dequantize(io.readUint(3), 7),
        };
      }

      if (![...COLOR_PREFIXES].some((code) => code.startsWith(prefix))) {
        throw new Error(`Invalid palette-color prefix: ${prefix}`);
      }
    }
  }

  private closestPreset(color: Color): PresetColor {
    let best = PRESETS[0];
    let bestDistance = Infinity;

    for (const preset of PRESETS) {
      const distance = this.distanceSquared(color, preset.color);
      if (distance < bestDistance) {
        best = preset;
        bestDistance = distance;
      }
    }

    return best;
  }

  private distanceSquared(a: Color, b: Color): number {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return dr * dr + dg * dg + db * db;
  }

  private quantize(value: number, max: number): number {
    return Math.round((value * max) / 255);
  }

  private dequantize(value: number, max: number): number {
    return Math.round((value * 255) / max);
  }

  private validateColor(color: Color): void {
    for (const [name, value] of Object.entries(color)) {
      if (!Number.isInteger(value) || value < 0 || value > 255) {
        throw new Error(`Invalid ${name} channel: ${value}`);
      }
    }
  }
}
