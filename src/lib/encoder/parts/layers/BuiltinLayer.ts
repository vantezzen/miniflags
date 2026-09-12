import type MiniFlag from "../../miniflag";
import { LayerCodec, assertUnit, type LayerEnvironment } from "./Layer";
import type { BuiltinLayerDefinition, BuiltinPlacement } from "./types";

type BuiltinMode =
  | "union-jack-full"
  | "union-jack-canton"
  | "union-jack-previous-region"
  | "union-jack-rectangle"
  | "generic";

const MODE_TO_CODE = new Map<BuiltinMode, string>([
  ["union-jack-full", "0"],
  ["union-jack-canton", "10"],
  ["union-jack-previous-region", "110"],
  ["union-jack-rectangle", "1110"],
  ["generic", "1111"],
]);

const CODE_TO_MODE = new Map(
  [...MODE_TO_CODE.entries()].map(([mode, code]) => [code, mode]),
);

const PLACEMENT_TO_CODE = new Map<BuiltinPlacement["type"], string>([
  ["full", "0"],
  ["canton", "10"],
  ["previous-region", "110"],
  ["rectangle", "111"],
]);

const CODE_TO_PLACEMENT = new Map(
  [...PLACEMENT_TO_CODE.entries()].map(([placement, code]) => [
    code,
    placement,
  ]),
);

export class BuiltinLayerCodec extends LayerCodec<BuiltinLayerDefinition> {
  public readonly kind = "builtin" as const;
  public readonly code = "111110";

  public encode(
    io: MiniFlag,
    layer: Readonly<BuiltinLayerDefinition>,
    env: LayerEnvironment,
  ): void {
    const placement = layer.placement ?? { type: "full" as const };

    if (layer.builtin === "union-jack") {
      const mode: BuiltinMode =
        placement.type === "full"
          ? "union-jack-full"
          : placement.type === "canton"
            ? "union-jack-canton"
            : placement.type === "previous-region"
              ? "union-jack-previous-region"
              : "union-jack-rectangle";

      if (placement.type === "previous-region")
        this.validatePreviousRegion(env);
      io.writeBits(MODE_TO_CODE.get(mode)!);
      if (placement.type === "rectangle") this.writeRect(io, placement);
      return;
    }

    io.writeBits(MODE_TO_CODE.get("generic")!);
    if (layer.builtin.id < 1n) throw new Error("Builtin id must be >= 1");
    io.writeGamma(layer.builtin.id);
    this.writePlacement(io, placement, env);
  }

  public decode(io: MiniFlag, env: LayerEnvironment): BuiltinLayerDefinition {
    const mode = io.readPrefix(CODE_TO_MODE);

    switch (mode) {
      case "union-jack-full":
        return {
          kind: "builtin",
          builtin: "union-jack",
          placement: { type: "full" },
        };
      case "union-jack-canton":
        return {
          kind: "builtin",
          builtin: "union-jack",
          placement: { type: "canton" },
        };
      case "union-jack-previous-region":
        this.validatePreviousRegion(env);
        return {
          kind: "builtin",
          builtin: "union-jack",
          placement: { type: "previous-region" },
        };
      case "union-jack-rectangle":
        return {
          kind: "builtin",
          builtin: "union-jack",
          placement: this.readRect(io),
        };
      case "generic": {
        const id = io.readGamma();
        const placement = this.readPlacement(io, env);
        return { kind: "builtin", builtin: { id }, placement };
      }
    }
  }

  private writePlacement(
    io: MiniFlag,
    placement: BuiltinPlacement,
    env: LayerEnvironment,
  ): void {
    if (placement.type === "previous-region") this.validatePreviousRegion(env);
    io.writeBits(PLACEMENT_TO_CODE.get(placement.type)!);
    if (placement.type === "rectangle") this.writeRect(io, placement);
  }

  private readPlacement(io: MiniFlag, env: LayerEnvironment): BuiltinPlacement {
    const type = io.readPrefix(CODE_TO_PLACEMENT);
    if (type === "previous-region") {
      this.validatePreviousRegion(env);
      return { type };
    }
    if (type === "rectangle") return this.readRect(io);
    return { type };
  }

  private writeRect(
    io: MiniFlag,
    rect: Extract<BuiltinPlacement, { type: "rectangle" }>,
  ): void {
    assertUnit(rect.x, "Builtin x");
    assertUnit(rect.y, "Builtin y");
    assertUnit(rect.width, "Builtin width");
    assertUnit(rect.height, "Builtin height");
    if (rect.width <= 0 || rect.height <= 0)
      throw new Error("Builtin rectangle must have positive size");
    io.writeUnit5(rect.x);
    io.writeUnit5(rect.y);
    io.writeUnit5(rect.width);
    io.writeUnit5(rect.height);
  }

  private readRect(
    io: MiniFlag,
  ): Extract<BuiltinPlacement, { type: "rectangle" }> {
    return {
      type: "rectangle",
      x: io.readUnit5(),
      y: io.readUnit5(),
      width: io.readUnit5(),
      height: io.readUnit5(),
    };
  }
}
