import type MiniFlag from "../../miniflag";
import { gcd } from "../../miniflag";
import {
  LayerCodec,
  assertPositiveInteger,
  type LayerEnvironment,
} from "./Layer";
import type { Stripe, StripesLayerDefinition } from "./types";

type StripeMode =
  | "palette-equal"
  | "solid-0"
  | "first-two-equal"
  | "aba-equal"
  | "aba-121"
  | "abcba-11211"
  | "alternating-01"
  | "aba-212"
  | "explicit-equal"
  | "explicit-weighted";

const MODE_TO_CODE = new Map<StripeMode, string>([
  ["palette-equal", "0"],
  ["solid-0", "10"],
  ["first-two-equal", "110"],
  ["aba-equal", "1110"],
  ["aba-121", "11110"],
  ["abcba-11211", "111110"],
  ["alternating-01", "1111110"],
  ["aba-212", "11111110"],
  ["explicit-equal", "111111110"],
  ["explicit-weighted", "111111111"],
]);

const CODE_TO_MODE = new Map(
  [...MODE_TO_CODE.entries()].map(([mode, code]) => [code, mode]),
);

const REPEAT_COUNT_TO_CODE = new Map<number, string>([
  [13, "0"], // United States
  [14, "10"], // Malaysia
  [9, "110"], // Greece / Uruguay
  [11, "1110"], // Liberia
]);

const CODE_TO_REPEAT_COUNT = new Map(
  [...REPEAT_COUNT_TO_CODE.entries()].map(([count, code]) => [code, count]),
);

const CUSTOM_REPEAT_COUNT = "1111";
const REPEAT_COUNT_PREFIXES = new Set([
  ...CODE_TO_REPEAT_COUNT.keys(),
  CUSTOM_REPEAT_COUNT,
]);

export class StripesLayerCodec extends LayerCodec<StripesLayerDefinition> {
  public readonly kind = "stripes" as const;
  public readonly code = "0";

  public encode(
    io: MiniFlag,
    layer: Readonly<StripesLayerDefinition>,
    env: LayerEnvironment,
  ): void {
    const normalized = this.normalize(layer);
    const paletteSize = this.paletteSize(env);
    for (const stripe of normalized.stripes) {
      if (
        !Number.isSafeInteger(stripe.color) ||
        stripe.color < 0 ||
        stripe.color >= paletteSize
      ) {
        throw new Error(
          `Invalid palette color index ${stripe.color}/${paletteSize}`,
        );
      }
    }
    const mode = this.selectMode(normalized, paletteSize);

    io.writeBits(MODE_TO_CODE.get(mode)!);

    if (mode !== "solid-0") {
      io.writeBit(normalized.direction === "vertical" ? 1 : 0);
    }

    switch (mode) {
      case "palette-equal":
      case "solid-0":
      case "first-two-equal":
      case "aba-equal":
      case "aba-121":
      case "abcba-11211":
      case "aba-212":
        return;

      case "alternating-01":
        this.writeRepeatCount(io, normalized.stripes.length);
        return;

      case "explicit-equal":
        io.writeGamma(BigInt(normalized.stripes.length));
        for (const stripe of normalized.stripes) {
          this.writeColor(io, env, stripe.color);
        }
        return;

      case "explicit-weighted":
        io.writeGamma(BigInt(normalized.stripes.length));
        for (const stripe of normalized.stripes) {
          this.writeColor(io, env, stripe.color);
          io.writeGamma(BigInt(stripe.weight));
        }
        return;
    }
  }

  public decode(io: MiniFlag, env: LayerEnvironment): StripesLayerDefinition {
    const mode = io.readPrefix(CODE_TO_MODE);
    const direction =
      mode === "solid-0" || io.readBit() === 0 ? "horizontal" : "vertical";

    let stripes: Stripe[];

    switch (mode) {
      case "palette-equal":
        stripes = Array.from({ length: this.paletteSize(env) }, (_, color) => ({
          color,
        }));
        break;

      case "solid-0":
        stripes = [{ color: 0 }];
        break;

      case "first-two-equal":
        this.requirePalette(env, 2);
        stripes = [{ color: 0 }, { color: 1 }];
        break;

      case "aba-equal":
        this.requirePalette(env, 2);
        stripes = [{ color: 0 }, { color: 1 }, { color: 0 }];
        break;

      case "aba-121":
        this.requirePalette(env, 2);
        stripes = [
          { color: 0, weight: 1 },
          { color: 1, weight: 2 },
          { color: 0, weight: 1 },
        ];
        break;

      case "abcba-11211":
        this.requirePalette(env, 3);
        stripes = [
          { color: 0, weight: 1 },
          { color: 1, weight: 1 },
          { color: 2, weight: 2 },
          { color: 1, weight: 1 },
          { color: 0, weight: 1 },
        ];
        break;

      case "alternating-01": {
        this.requirePalette(env, 2);
        const count = this.readRepeatCount(io);
        stripes = Array.from({ length: count }, (_, i) => ({ color: i & 1 }));
        break;
      }

      case "aba-212":
        this.requirePalette(env, 2);
        stripes = [
          { color: 0, weight: 2 },
          { color: 1, weight: 1 },
          { color: 0, weight: 2 },
        ];
        break;

      case "explicit-equal": {
        const count = this.readSafeCount(io, "stripe count");
        stripes = Array.from({ length: count }, () => ({
          color: this.readColor(io, env),
        }));
        break;
      }

      case "explicit-weighted": {
        const count = this.readSafeCount(io, "stripe count");
        stripes = Array.from({ length: count }, () => ({
          color: this.readColor(io, env),
          weight: this.readSafeCount(io, "stripe weight"),
        }));
        break;
      }
    }

    return { kind: "stripes", direction, stripes };
  }

  private normalize(layer: Readonly<StripesLayerDefinition>): {
    direction: StripesLayerDefinition["direction"];
    stripes: Array<{ color: number; weight: number }>;
  } {
    if (layer.stripes.length < 1) {
      throw new Error("A stripes layer must contain at least one stripe");
    }

    const stripes = layer.stripes.map((stripe) => {
      const weight = stripe.weight ?? 1;
      assertPositiveInteger(weight, "Stripe weight");
      return { color: stripe.color, weight };
    });

    let divisor = BigInt(stripes[0].weight);
    for (let i = 1; i < stripes.length; i++) {
      divisor = gcd(divisor, BigInt(stripes[i].weight));
    }

    const d = Number(divisor);
    return {
      direction: layer.direction,
      stripes: stripes.map((stripe) => ({
        ...stripe,
        weight: stripe.weight / d,
      })),
    };
  }

  private selectMode(
    layer: { stripes: Array<{ color: number; weight: number }> },
    paletteSize: number,
  ): StripeMode {
    const colors = layer.stripes.map((stripe) => stripe.color);
    const weights = layer.stripes.map((stripe) => stripe.weight);
    const equal = weights.every((weight) => weight === 1);

    if (
      equal &&
      colors.length === paletteSize &&
      colors.every((color, i) => color === i)
    )
      return "palette-equal";

    if (equal && this.same(colors, [0])) return "solid-0";
    if (equal && this.same(colors, [0, 1])) return "first-two-equal";
    if (equal && this.same(colors, [0, 1, 0])) return "aba-equal";
    if (this.same(colors, [0, 1, 0]) && this.same(weights, [1, 2, 1]))
      return "aba-121";
    if (
      this.same(colors, [0, 1, 2, 1, 0]) &&
      this.same(weights, [1, 1, 2, 1, 1])
    )
      return "abcba-11211";

    if (
      equal &&
      colors.length >= 2 &&
      colors.every((color, i) => color === (i & 1))
    )
      return "alternating-01";

    if (this.same(colors, [0, 1, 0]) && this.same(weights, [2, 1, 2]))
      return "aba-212";
    if (equal) return "explicit-equal";
    return "explicit-weighted";
  }

  private writeRepeatCount(io: MiniFlag, count: number): void {
    assertPositiveInteger(count, "Repeat stripe count");
    const direct = REPEAT_COUNT_TO_CODE.get(count);

    if (direct !== undefined) {
      io.writeBits(direct);
      return;
    }

    io.writeBits(CUSTOM_REPEAT_COUNT);
    io.writeGamma(BigInt(count));
  }

  private readRepeatCount(io: MiniFlag): number {
    let prefix = "";

    while (true) {
      prefix += String(io.readBit());

      const direct = CODE_TO_REPEAT_COUNT.get(prefix);
      if (direct !== undefined) return direct;

      if (prefix === CUSTOM_REPEAT_COUNT) {
        return this.bigintToSafeNumber(io.readGamma(), "Repeat stripe count");
      }

      if (![...REPEAT_COUNT_PREFIXES].some((code) => code.startsWith(prefix))) {
        throw new Error(`Invalid repeat-count prefix: ${prefix}`);
      }
    }
  }

  private readSafeCount(io: MiniFlag, name: string): number {
    return this.bigintToSafeNumber(io.readGamma(), name);
  }

  private bigintToSafeNumber(value: bigint, name: string): number {
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(`${name} is too large`);
    }
    return Number(value);
  }

  private requirePalette(env: LayerEnvironment, minimum: number): void {
    if (this.paletteSize(env) < minimum) {
      throw new Error(
        `Stripe mode requires at least ${minimum} palette colors`,
      );
    }
  }

  private same<T>(a: readonly T[], b: readonly T[]): boolean {
    return a.length === b.length && a.every((value, i) => value === b[i]);
  }
}
