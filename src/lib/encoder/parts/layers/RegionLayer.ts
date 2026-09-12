import type MiniFlag from "../../miniflag";
import { LayerCodec, assertUnit, type LayerEnvironment } from "./Layer";
import type { RegionLayerDefinition, RegionSpec } from "./types";

type RegionType = RegionSpec["type"];

const TYPE_TO_CODE = new Map<RegionType, string>([
  ["hoist-triangle", "0"],
  ["canton", "10"],
  ["diagonal-half", "110"],
  ["center-rect", "1110"],
  ["rectangle", "11110"],
  ["triangle", "11111"],
]);

const CODE_TO_TYPE = new Map(
  [...TYPE_TO_CODE.entries()].map(([type, code]) => [code, type]),
);

export class RegionLayerCodec extends LayerCodec<RegionLayerDefinition> {
  public readonly kind = "region" as const;
  public readonly code = "110";

  public encode(
    io: MiniFlag,
    layer: Readonly<RegionLayerDefinition>,
    env: LayerEnvironment,
  ): void {
    io.writeBits(TYPE_TO_CODE.get(layer.region.type)!);
    this.writeColor(io, env, layer.color);

    switch (layer.region.type) {
      case "hoist-triangle": {
        const custom =
          layer.region.apexX !== undefined || layer.region.apexY !== undefined;
        io.writeBit(custom ? 1 : 0);
        if (custom) {
          const x = layer.region.apexX ?? 1 / 3;
          const y = layer.region.apexY ?? 1 / 2;
          assertUnit(x, "Triangle apexX");
          assertUnit(y, "Triangle apexY");
          io.writeUnit5(x);
          io.writeUnit5(y);
        }
        return;
      }

      case "canton": {
        const custom =
          layer.region.width !== undefined || layer.region.height !== undefined;
        io.writeBit(custom ? 1 : 0);
        if (custom) {
          const width = layer.region.width ?? 1 / 2;
          const height = layer.region.height ?? 1 / 2;
          this.writePositiveUnit(io, width, "Canton width");
          this.writePositiveUnit(io, height, "Canton height");
        }
        return;
      }

      case "diagonal-half":
        io.writeBit(layer.region.direction === "backslash" ? 1 : 0);
        io.writeBit(layer.region.side);
        return;

      case "center-rect": {
        const custom =
          layer.region.width !== undefined || layer.region.height !== undefined;
        io.writeBit(custom ? 1 : 0);
        if (custom) {
          const width = layer.region.width ?? 1 / 2;
          const height = layer.region.height ?? 1 / 2;
          this.writePositiveUnit(io, width, "Centered rectangle width");
          this.writePositiveUnit(io, height, "Centered rectangle height");
        }
        return;
      }

      case "rectangle":
        this.writeRect(io, layer.region);
        return;

      case "triangle":
        for (const point of layer.region.points) {
          assertUnit(point.x, "Triangle point x");
          assertUnit(point.y, "Triangle point y");
          io.writeUnit5(point.x);
          io.writeUnit5(point.y);
        }
        return;
    }
  }

  public decode(io: MiniFlag, env: LayerEnvironment): RegionLayerDefinition {
    const type = io.readPrefix(CODE_TO_TYPE);
    const color = this.readColor(io, env);
    let region: RegionSpec;

    switch (type) {
      case "hoist-triangle":
        region =
          io.readBit() === 0
            ? { type }
            : { type, apexX: io.readUnit5(), apexY: io.readUnit5() };
        break;

      case "canton":
        region =
          io.readBit() === 0
            ? { type }
            : { type, width: io.readUnit5(), height: io.readUnit5() };
        break;

      case "diagonal-half":
        region = {
          type,
          direction: io.readBit() === 0 ? "slash" : "backslash",
          side: io.readBit(),
        };
        break;

      case "center-rect":
        region =
          io.readBit() === 0
            ? { type }
            : { type, width: io.readUnit5(), height: io.readUnit5() };
        break;

      case "rectangle":
        region = {
          type,
          x: io.readUnit5(),
          y: io.readUnit5(),
          width: io.readUnit5(),
          height: io.readUnit5(),
        };
        break;

      case "triangle":
        region = {
          type,
          points: [
            { x: io.readUnit5(), y: io.readUnit5() },
            { x: io.readUnit5(), y: io.readUnit5() },
            { x: io.readUnit5(), y: io.readUnit5() },
          ],
        };
        break;
    }

    return { kind: "region", color, region };
  }

  private writeRect(
    io: MiniFlag,
    rect: { x: number; y: number; width: number; height: number },
  ): void {
    assertUnit(rect.x, "Rectangle x");
    assertUnit(rect.y, "Rectangle y");
    assertUnit(rect.width, "Rectangle width");
    assertUnit(rect.height, "Rectangle height");
    if (rect.width <= 0 || rect.height <= 0) {
      throw new Error("Rectangle must have positive width and height");
    }

    io.writeUnit5(rect.x);
    io.writeUnit5(rect.y);
    io.writeUnit5(rect.width);
    io.writeUnit5(rect.height);
  }

  private writePositiveUnit(io: MiniFlag, value: number, name: string): void {
    assertUnit(value, name);
    if (value <= 0) throw new Error(`${name} must be > 0`);
    io.writeUnit5(value);
  }
}
