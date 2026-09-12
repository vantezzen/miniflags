import type MiniFlag from "../../miniflag";
import { LayerCodec, assertUnit, type LayerEnvironment } from "./Layer";
import type { BandLayerDefinition } from "./types";

type BandDirection = BandLayerDefinition["direction"];

const DIRECTION_TO_CODE = new Map<BandDirection, string>([
  ["slash", "0"],
  ["backslash", "10"],
  ["horizontal", "110"],
  ["vertical", "111"],
]);

const CODE_TO_DIRECTION = new Map(
  [...DIRECTION_TO_CODE.entries()].map(([direction, code]) => [
    code,
    direction,
  ]),
);

export class BandLayerCodec extends LayerCodec<BandLayerDefinition> {
  public readonly kind = "band" as const;
  public readonly code = "11110";

  public encode(
    io: MiniFlag,
    layer: Readonly<BandLayerDefinition>,
    env: LayerEnvironment,
  ): void {
    io.writeBits(DIRECTION_TO_CODE.get(layer.direction)!);
    this.writeColor(io, env, layer.color);

    io.writeBit(layer.borderColor === undefined ? 0 : 1);
    if (layer.borderColor !== undefined) {
      this.writeColor(io, env, layer.borderColor);
    }

    io.writeBit(layer.width === undefined ? 0 : 1);
    if (layer.width !== undefined) {
      assertUnit(layer.width, "Band width");
      if (layer.width <= 0) throw new Error("Band width must be > 0");
      io.writeUnit5(layer.width);
    }
  }

  public decode(io: MiniFlag, env: LayerEnvironment): BandLayerDefinition {
    const direction = io.readPrefix(CODE_TO_DIRECTION);
    const color = this.readColor(io, env);
    const borderColor =
      io.readBit() === 1 ? this.readColor(io, env) : undefined;
    const width = io.readBit() === 1 ? io.readUnit5() : undefined;

    return { kind: "band", direction, color, borderColor, width };
  }
}
