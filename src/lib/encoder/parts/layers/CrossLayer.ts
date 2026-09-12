import type MiniFlag from "../../miniflag";
import { LayerCodec, assertUnit, type LayerEnvironment } from "./Layer";
import type { CrossLayerDefinition, CrossStyle } from "./types";

const STYLE_TO_CODE = new Map<CrossStyle, string>([
  ["nordic", "0"],
  ["centered", "10"],
  ["centered-in-previous-region", "110"],
  ["saltire", "1110"],
  ["saltire-in-previous-region", "1111"],
]);

const CODE_TO_STYLE = new Map(
  [...STYLE_TO_CODE.entries()].map(([style, code]) => [code, style]),
);

export class CrossLayerCodec extends LayerCodec<CrossLayerDefinition> {
  public readonly kind = "cross" as const;
  public readonly code = "1110";

  public encode(
    io: MiniFlag,
    layer: Readonly<CrossLayerDefinition>,
    env: LayerEnvironment,
  ): void {
    if (layer.style.includes("previous-region")) {
      this.validatePreviousRegion(env);
    }

    io.writeBits(STYLE_TO_CODE.get(layer.style)!);
    this.writeColor(io, env, layer.color);

    io.writeBit(layer.borderColor === undefined ? 0 : 1);
    if (layer.borderColor !== undefined) {
      this.writeColor(io, env, layer.borderColor);
    }

    if (layer.offset !== undefined && layer.style !== "nordic") {
      throw new Error("Cross offset is only valid for Nordic crosses");
    }

    const customGeometry =
      layer.width !== undefined || layer.offset !== undefined;
    io.writeBit(customGeometry ? 1 : 0);

    if (customGeometry) {
      const width = layer.width ?? 0.12;
      this.writePositiveUnit(io, width, "Cross width");

      if (layer.style === "nordic") {
        const offset = layer.offset ?? 1 / 3;
        assertUnit(offset, "Cross offset");
        io.writeUnit5(offset);
      }
    }
  }

  public decode(io: MiniFlag, env: LayerEnvironment): CrossLayerDefinition {
    const style = io.readPrefix(CODE_TO_STYLE);
    if (style.includes("previous-region")) {
      this.validatePreviousRegion(env);
    }

    const color = this.readColor(io, env);
    const borderColor =
      io.readBit() === 1 ? this.readColor(io, env) : undefined;

    if (io.readBit() === 0) {
      return { kind: "cross", style, color, borderColor };
    }

    const width = io.readUnit5();
    const offset = style === "nordic" ? io.readUnit5() : undefined;

    return {
      kind: "cross",
      style,
      color,
      borderColor,
      width,
      offset,
    };
  }

  private writePositiveUnit(io: MiniFlag, value: number, name: string): void {
    assertUnit(value, name);
    if (value <= 0) throw new Error(`${name} must be > 0`);
    io.writeUnit5(value);
  }
}
