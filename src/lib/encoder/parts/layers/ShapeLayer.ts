import type MiniFlag from "../../miniflag";
import {
  LayerCodec,
  assertPositiveInteger,
  assertUnit,
  type LayerEnvironment,
} from "./Layer";
import type {
  LayerScope,
  ShapeLayerDefinition,
  ShapePlacement,
  ShapePoint,
  ShapeSpec,
} from "./types";

type ShapeType = ShapeSpec["type"];
type PlacementType = ShapePlacement["type"];

const SHAPE_TO_CODE = new Map<ShapeType, string>([
  ["star", "0"],
  ["disc", "10"],
  ["crescent", "110"],
  ["sun", "1110"],
  ["diamond", "11110"],
  ["cross", "11111"],
]);

const CODE_TO_SHAPE = new Map(
  [...SHAPE_TO_CODE.entries()].map(([shape, code]) => [code, shape]),
);

const CROSS_STYLE_TO_CODE = new Map<"greek" | "swiss" | "bolnisi", string>([
  ["greek", "0"],
  ["swiss", "10"],
  ["bolnisi", "11"],
]);

const CODE_TO_CROSS_STYLE = new Map(
  [...CROSS_STYLE_TO_CODE.entries()].map(([style, code]) => [code, style]),
);

const PLACEMENT_TO_CODE = new Map<PlacementType, string>([
  ["center", "0"],
  ["custom", "10"],
  ["ring", "110"],
  ["us50", "1110"],
  ["grid", "11110"],
  ["points", "11111"],
]);

const CODE_TO_PLACEMENT = new Map(
  [...PLACEMENT_TO_CODE.entries()].map(([placement, code]) => [
    code,
    placement,
  ]),
);

const STAR_POINTS_TO_CODE = new Map<number, string>([
  [5, "0"],
  [6, "10"],
  [4, "110"],
  [7, "1110"],
  [8, "11110"],
  [12, "111110"],
]);
const CUSTOM_STAR_POINTS = "111111";

const SUN_RAYS_TO_CODE = new Map<number, string>([
  [12, "0"],
  [16, "10"],
  [24, "110"],
  [32, "1110"],
]);
const CUSTOM_SUN_RAYS = "1111";

const RING_COUNT_TO_CODE = new Map<number, string>([
  [12, "0"], // European-style star circle
  [10, "10"], // Cabo Verde
]);
const CUSTOM_RING_COUNT = "11";

export class ShapeLayerCodec extends LayerCodec<ShapeLayerDefinition> {
  public readonly kind = "shape" as const;
  public readonly code = "10";

  public encode(
    io: MiniFlag,
    layer: Readonly<ShapeLayerDefinition>,
    env: LayerEnvironment,
  ): void {
    io.writeBits(SHAPE_TO_CODE.get(layer.shape.type)!);
    this.writeShapeDetails(io, layer.shape);
    this.writeColor(io, env, layer.color);

    io.writeBit(layer.borderColor === undefined ? 0 : 1);
    if (layer.borderColor !== undefined) {
      this.writeColor(io, env, layer.borderColor);
    }

    const placement = layer.placement ?? { type: "center" as const };
    io.writeBits(PLACEMENT_TO_CODE.get(placement.type)!);
    this.writePlacement(io, placement, env);
  }

  public decode(io: MiniFlag, env: LayerEnvironment): ShapeLayerDefinition {
    const shapeType = io.readPrefix(CODE_TO_SHAPE);
    const shape = this.readShapeDetails(io, shapeType);
    const color = this.readColor(io, env);
    const borderColor =
      io.readBit() === 1 ? this.readColor(io, env) : undefined;
    const placementType = io.readPrefix(CODE_TO_PLACEMENT);
    const placement = this.readPlacement(io, placementType, env);

    return {
      kind: "shape",
      shape,
      color,
      borderColor,
      placement,
    };
  }

  private writeShapeDetails(io: MiniFlag, shape: ShapeSpec): void {
    switch (shape.type) {
      case "star":
        this.writeSpecialCount(
          io,
          shape.points ?? 5,
          STAR_POINTS_TO_CODE,
          CUSTOM_STAR_POINTS,
          "Star points",
        );
        return;

      case "sun":
        this.writeSpecialCount(
          io,
          shape.rays ?? 12,
          SUN_RAYS_TO_CODE,
          CUSTOM_SUN_RAYS,
          "Sun rays",
        );
        return;

      case "cross":
        io.writeBits(CROSS_STYLE_TO_CODE.get(shape.style ?? "greek")!);
        return;

      case "disc":
      case "crescent":
      case "diamond":
        return;
    }
  }

  private readShapeDetails(io: MiniFlag, type: ShapeType): ShapeSpec {
    switch (type) {
      case "star":
        return {
          type,
          points: this.readSpecialCount(
            io,
            STAR_POINTS_TO_CODE,
            CUSTOM_STAR_POINTS,
            "Star points",
          ),
        };

      case "sun":
        return {
          type,
          rays: this.readSpecialCount(
            io,
            SUN_RAYS_TO_CODE,
            CUSTOM_SUN_RAYS,
            "Sun rays",
          ),
        };

      case "cross":
        return { type, style: io.readPrefix(CODE_TO_CROSS_STYLE) };

      case "disc":
      case "crescent":
      case "diamond":
        return { type };
    }
  }

  private writePlacement(
    io: MiniFlag,
    placement: ShapePlacement,
    env: LayerEnvironment,
  ): void {
    switch (placement.type) {
      case "center":
        return;

      case "custom": {
        this.writeScope(io, env, placement.scope);
        const mask =
          (placement.x !== undefined || placement.y !== undefined ? 4 : 0) |
          (placement.size !== undefined ? 2 : 0) |
          (placement.rotation !== undefined ? 1 : 0);

        if (mask === 0) {
          throw new Error(
            "Custom shape placement must customize position, size, or rotation",
          );
        }

        io.writeUint(mask, 3);
        if (mask & 4) {
          const x = placement.x ?? 0.5;
          const y = placement.y ?? 0.5;
          assertUnit(x, "Shape x");
          assertUnit(y, "Shape y");
          io.writeUnit5(x);
          io.writeUnit5(y);
        }
        if (mask & 2) {
          this.writePositiveUnit(io, placement.size!, "Shape size");
        }
        if (mask & 1) {
          io.writeAngle4(placement.rotation!);
        }
        return;
      }

      case "ring": {
        this.writeScope(io, env, placement.scope);
        this.writeRingCount(io, placement.count);

        const custom =
          placement.x !== undefined ||
          placement.y !== undefined ||
          placement.size !== undefined ||
          placement.rotation !== undefined;

        io.writeBit(custom ? 1 : 0);
        if (custom) {
          const x = placement.x ?? 0.5;
          const y = placement.y ?? 0.5;
          const size = placement.size ?? 0.32;
          const rotation = placement.rotation ?? 0;
          assertUnit(x, "Ring x");
          assertUnit(y, "Ring y");
          assertUnit(size, "Ring size");
          if (size <= 0) throw new Error("Ring size must be > 0");
          io.writeUnit5(x);
          io.writeUnit5(y);
          io.writeUnit5(size);
          io.writeAngle4(rotation);
        }
        return;
      }

      case "us50":
        this.validatePreviousRegion(env);
        return;

      case "grid": {
        this.writeScope(io, env, placement.scope);
        assertPositiveInteger(placement.rows, "Grid rows");
        assertPositiveInteger(placement.columns, "Grid columns");
        io.writeGamma(BigInt(placement.rows));
        io.writeGamma(BigInt(placement.columns));

        const customBounds = [
          placement.x,
          placement.y,
          placement.width,
          placement.height,
        ].some((value) => value !== undefined);
        io.writeBit(customBounds ? 1 : 0);
        if (customBounds) {
          const x = placement.x ?? 0;
          const y = placement.y ?? 0;
          const width = placement.width ?? 1;
          const height = placement.height ?? 1;
          assertUnit(x, "Grid x");
          assertUnit(y, "Grid y");
          assertUnit(width, "Grid width");
          assertUnit(height, "Grid height");
          if (width <= 0 || height <= 0)
            throw new Error("Grid bounds must have positive size");
          io.writeUnit5(x);
          io.writeUnit5(y);
          io.writeUnit5(width);
          io.writeUnit5(height);
        }
        return;
      }

      case "points": {
        this.writeScope(io, env, placement.scope);
        if (placement.points.length < 1) {
          throw new Error("Explicit shape points require at least one point");
        }
        io.writeGamma(BigInt(placement.points.length));

        io.writeBit(placement.defaultSize === undefined ? 0 : 1);
        if (placement.defaultSize !== undefined) {
          this.writePositiveUnit(
            io,
            placement.defaultSize,
            "Default point size",
          );
        }

        for (const point of placement.points) {
          this.writePoint(io, point, placement.defaultSize);
        }
        return;
      }
    }
  }

  private readPlacement(
    io: MiniFlag,
    type: PlacementType,
    env: LayerEnvironment,
  ): ShapePlacement {
    switch (type) {
      case "center":
        return { type };

      case "custom": {
        const scope = this.readScope(io, env);
        const mask = io.readUint(3);
        if (mask === 0) throw new Error("Non-canonical empty custom placement");

        const result: {
          type: "custom";
          scope: LayerScope;
          x?: number;
          y?: number;
          size?: number;
          rotation?: number;
        } = { type, scope };

        if (mask & 4) {
          result.x = io.readUnit5();
          result.y = io.readUnit5();
        }
        if (mask & 2) result.size = io.readUnit5();
        if (mask & 1) result.rotation = io.readAngle4();
        return result;
      }

      case "ring": {
        const scope = this.readScope(io, env);
        const count = this.readRingCount(io);
        if (io.readBit() === 0) return { type, scope, count };
        return {
          type,
          scope,
          count,
          x: io.readUnit5(),
          y: io.readUnit5(),
          size: io.readUnit5(),
          rotation: io.readAngle4(),
        };
      }

      case "us50":
        this.validatePreviousRegion(env);
        return { type };

      case "grid": {
        const scope = this.readScope(io, env);
        const rows = this.gammaToNumber(io.readGamma(), "Grid rows");
        const columns = this.gammaToNumber(io.readGamma(), "Grid columns");
        if (io.readBit() === 0) return { type, scope, rows, columns };
        return {
          type,
          scope,
          rows,
          columns,
          x: io.readUnit5(),
          y: io.readUnit5(),
          width: io.readUnit5(),
          height: io.readUnit5(),
        };
      }

      case "points": {
        const scope = this.readScope(io, env);
        const count = this.gammaToNumber(io.readGamma(), "Point count");
        const defaultSize = io.readBit() === 1 ? io.readUnit5() : undefined;
        const points = Array.from({ length: count }, () =>
          this.readPoint(io, defaultSize),
        );
        return { type, scope, points, defaultSize };
      }
    }
  }

  private writePoint(
    io: MiniFlag,
    point: ShapePoint,
    defaultSize?: number,
  ): void {
    assertUnit(point.x, "Point x");
    assertUnit(point.y, "Point y");
    io.writeUnit5(point.x);
    io.writeUnit5(point.y);

    const hasOwnSize = point.size !== undefined && point.size !== defaultSize;
    io.writeBit(hasOwnSize ? 1 : 0);
    if (hasOwnSize) this.writePositiveUnit(io, point.size!, "Point size");

    io.writeBit(point.rotation === undefined ? 0 : 1);
    if (point.rotation !== undefined) io.writeAngle4(point.rotation);
  }

  private readPoint(io: MiniFlag, defaultSize?: number): ShapePoint {
    const point: { x: number; y: number; size?: number; rotation?: number } = {
      x: io.readUnit5(),
      y: io.readUnit5(),
    };

    if (io.readBit() === 1) point.size = io.readUnit5();
    else if (defaultSize !== undefined) point.size = defaultSize;

    if (io.readBit() === 1) point.rotation = io.readAngle4();
    return point;
  }

  private writeSpecialCount(
    io: MiniFlag,
    count: number,
    direct: ReadonlyMap<number, string>,
    customCode: string,
    name: string,
  ): void {
    assertPositiveInteger(count, name);
    const code = direct.get(count);
    if (code !== undefined) {
      io.writeBits(code);
      return;
    }
    io.writeBits(customCode);
    io.writeGamma(BigInt(count));
  }

  private readSpecialCount(
    io: MiniFlag,
    direct: ReadonlyMap<number, string>,
    customCode: string,
    name: string,
  ): number {
    const reverse = new Map(
      [...direct.entries()].map(([value, code]) => [code, value]),
    );
    let prefix = "";

    while (true) {
      prefix += String(io.readBit());
      const value = reverse.get(prefix);
      if (value !== undefined) return value;
      if (prefix === customCode)
        return this.gammaToNumber(io.readGamma(), name);

      const candidates = [...reverse.keys(), customCode];
      if (!candidates.some((code) => code.startsWith(prefix))) {
        throw new Error(`Invalid ${name} prefix: ${prefix}`);
      }
    }
  }

  private writeRingCount(io: MiniFlag, count: number): void {
    this.writeSpecialCount(
      io,
      count,
      RING_COUNT_TO_CODE,
      CUSTOM_RING_COUNT,
      "Ring count",
    );
  }

  private readRingCount(io: MiniFlag): number {
    return this.readSpecialCount(
      io,
      RING_COUNT_TO_CODE,
      CUSTOM_RING_COUNT,
      "Ring count",
    );
  }

  private gammaToNumber(value: bigint, name: string): number {
    if (value > BigInt(Number.MAX_SAFE_INTEGER))
      throw new Error(`${name} is too large`);
    return Number(value);
  }

  private writePositiveUnit(io: MiniFlag, value: number, name: string): void {
    assertUnit(value, name);
    if (value <= 0) throw new Error(`${name} must be > 0`);
    io.writeUnit5(value);
  }
}
