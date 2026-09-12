import type {
  CrossShapeStyle,
  ShapeLayerDefinition,
  ShapePlacement,
  ShapeSpec,
} from "../../encoder/parts/layers/types";
import { minDimension, n } from "../svg";
import type {
  LayerRenderResult,
  RenderScope,
  SvgRenderEnvironment,
} from "../types";
import { LayerRenderer } from "./LayerRenderer";

const DEFAULT_RING_RADIUS = 0.32;

interface ShapeInstance {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly rotation: number;
}

export class ShapeRenderer extends LayerRenderer<ShapeLayerDefinition> {
  public readonly kind = "shape" as const;

  public render(
    layer: Readonly<ShapeLayerDefinition>,
    env: SvgRenderEnvironment,
  ): LayerRenderResult {
    const placement = layer.placement ?? { type: "center" as const };

    switch (placement.type) {
      case "center":
        return {
          svg: this.instances(layer, env, env.flagScope, [
            this.instance(
              env.flagScope,
              0.5,
              0.5,
              this.defaultSize(layer.shape),
              0,
            ),
          ]),
        };

      case "custom": {
        const scope = this.scope(env, placement.scope);
        return {
          svg: this.instances(layer, env, scope, [
            this.instance(
              scope,
              placement.x ?? 0.5,
              placement.y ?? 0.5,
              placement.size ?? this.defaultSize(layer.shape),
              placement.rotation ?? 0,
            ),
          ]),
        };
      }

      case "ring":
        return { svg: this.ring(layer, env, placement) };

      case "us50":
        return { svg: this.us50(layer, env) };

      case "grid":
        return { svg: this.grid(layer, env, placement) };

      case "points":
        return { svg: this.points(layer, env, placement) };
    }
  }

  private defaultSize(shape: Readonly<ShapeSpec>): number {
    switch (shape.type) {
      case "star":
        return 0.36;
      case "disc":
        return 0.46;
      case "crescent":
        return 0.46;
      case "sun":
        return 0.42;
      case "diamond":
        return 0.34;
      case "cross":
        return 0.6;
    }
  }

  private ring(
    layer: Readonly<ShapeLayerDefinition>,
    env: SvgRenderEnvironment,
    placement: Extract<ShapePlacement, { type: "ring" }>,
  ): string {
    const scope = this.scope(env, placement.scope);
    const min = minDimension(scope.bounds);
    const cx = scope.bounds.x + (placement.x ?? 0.5) * scope.bounds.width;
    const cy = scope.bounds.y + (placement.y ?? 0.5) * scope.bounds.height;
    const radius = min * (placement.size ?? DEFAULT_RING_RADIUS);
    const start = -Math.PI / 2 + (placement.rotation ?? 0) * Math.PI * 2;
    const spacing = (2 * Math.PI * radius) / placement.count;

    // Repeated charges should visually fill the ring instead of looking like
    // tiny dots. The spacing cap still guarantees neighbouring shapes do not
    // collide even for small rings such as Cabo Verde's ten stars.
    const shapeSize = Math.min(min * 0.15, spacing * 0.85);
    const instances: ShapeInstance[] = [];

    for (let i = 0; i < placement.count; i++) {
      const angle = start + (i / placement.count) * Math.PI * 2;
      instances.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        size: shapeSize,
        rotation: 0,
      });
    }

    return this.instances(layer, env, scope, instances);
  }

  private us50(
    layer: Readonly<ShapeLayerDefinition>,
    env: SvgRenderEnvironment,
  ): string {
    const scope = this.scope(env, "previous-region");
    const size = minDimension(scope.bounds) * 0.1;
    const instances: ShapeInstance[] = [];

    for (let row = 0; row < 9; row++) {
      const count = row % 2 === 0 ? 6 : 5;
      const y = (row + 1) / 10;

      for (let column = 0; column < count; column++) {
        const x = count === 6 ? (2 * column + 1) / 12 : (column + 1) / 6;
        instances.push({
          x: scope.bounds.x + x * scope.bounds.width,
          y: scope.bounds.y + y * scope.bounds.height,
          size,
          rotation: 0,
        });
      }
    }

    return this.instances(layer, env, scope, instances);
  }

  private grid(
    layer: Readonly<ShapeLayerDefinition>,
    env: SvgRenderEnvironment,
    placement: Extract<ShapePlacement, { type: "grid" }>,
  ): string {
    const scope = this.scope(env, placement.scope);
    const box = {
      x: scope.bounds.x + (placement.x ?? 0) * scope.bounds.width,
      y: scope.bounds.y + (placement.y ?? 0) * scope.bounds.height,
      width: (placement.width ?? 1) * scope.bounds.width,
      height: (placement.height ?? 1) * scope.bounds.height,
    };
    const cellWidth = box.width / placement.columns;
    const cellHeight = box.height / placement.rows;
    const size = Math.min(cellWidth, cellHeight) * 0.55;
    const instances: ShapeInstance[] = [];

    for (let row = 0; row < placement.rows; row++) {
      for (let column = 0; column < placement.columns; column++) {
        instances.push({
          x: box.x + (column + 0.5) * cellWidth,
          y: box.y + (row + 0.5) * cellHeight,
          size,
          rotation: 0,
        });
      }
    }

    return this.instances(layer, env, scope, instances);
  }

  private points(
    layer: Readonly<ShapeLayerDefinition>,
    env: SvgRenderEnvironment,
    placement: Extract<ShapePlacement, { type: "points" }>,
  ): string {
    const scope = this.scope(env, placement.scope);
    const min = minDimension(scope.bounds);
    const instances = placement.points.map((point): ShapeInstance => ({
      x: scope.bounds.x + point.x * scope.bounds.width,
      y: scope.bounds.y + point.y * scope.bounds.height,
      size: min * (point.size ?? placement.defaultSize ?? 0.1),
      rotation: point.rotation ?? 0,
    }));

    return this.instances(layer, env, scope, instances);
  }

  private instance(
    scope: RenderScope,
    x: number,
    y: number,
    size: number,
    rotation: number,
  ): ShapeInstance {
    return {
      x: scope.bounds.x + x * scope.bounds.width,
      y: scope.bounds.y + y * scope.bounds.height,
      size: minDimension(scope.bounds) * size,
      rotation,
    };
  }

  private instances(
    layer: Readonly<ShapeLayerDefinition>,
    env: SvgRenderEnvironment,
    scope: RenderScope,
    instances: readonly ShapeInstance[],
  ): string {
    if (instances.length === 0) return "";

    const geometry = this.unitGeometry(layer.shape);
    const fill = this.color(env, layer.color);
    const stroke =
      layer.borderColor === undefined
        ? ""
        : ` stroke="${this.color(env, layer.borderColor)}" stroke-width=".08" stroke-linejoin="round"`;

    if (instances.length === 1) {
      const item = instances[0];
      return env.clip(
        scope,
        `<g transform="${this.transform(item)}" fill="${fill}"${stroke}>${geometry}</g>`,
      );
    }

    const id = env.define(`shape:${this.shapeKey(layer.shape)}`, geometry);
    let svg = "";

    for (const item of instances) {
      svg += `<use href="#${id}" transform="${this.transform(item)}" fill="${fill}"${stroke}/>`;
    }

    return env.clip(scope, svg);
  }

  private transform(instance: ShapeInstance): string {
    const rotate =
      instance.rotation === 0 ? "" : ` rotate(${n(instance.rotation * 360)})`;
    return `translate(${n(instance.x)} ${n(instance.y)})${rotate} scale(${n(instance.size)})`;
  }

  /** Geometry is centered at the origin and has a nominal outer span of 1. */
  private unitGeometry(shape: Readonly<ShapeSpec>): string {
    switch (shape.type) {
      case "disc":
        return `<circle r=".5"/>`;

      case "diamond":
        return `<path d="M0-.5L.5 0L0 .5L-.5 0Z"/>`;

      case "star":
      case "sun":
        return `<polygon points="${this.radialPoints(shape)}"/>`;

      case "crescent":
        return `<path d="${this.crescentPath()}"/>`;

      case "cross":
        return `<path d="${this.crossPath(shape.style ?? "greek")}"/>`;
    }
  }

  /**
   * A proper single-outline crescent.
   *
   * The old renderer subtracted an entire overlapping circle with even/odd
   * fill. Because part of that circle lay outside the outer disc, that could
   * produce a detached painted lobe. This path joins only the two circle arcs
   * between their intersections, so the crescent is always one clean shape.
   * Its opening points to the right before rotation is applied.
   */
  private crescentPath(): string {
    const outerRadius = 0.5;
    const innerRadius = 0.4;
    const innerX = 0.2;

    const x =
      (outerRadius * outerRadius -
        innerRadius * innerRadius +
        innerX * innerX) /
      (2 * innerX);
    const y = Math.sqrt(outerRadius * outerRadius - x * x);

    return (
      `M${n(x)} ${n(-y)}` +
      `A${n(outerRadius)} ${n(outerRadius)} 0 1 0 ${n(x)} ${n(y)}` +
      `A${n(innerRadius)} ${n(innerRadius)} 0 1 1 ${n(x)} ${n(-y)}Z`
    );
  }

  private crossPath(style: CrossShapeStyle): string {
    switch (style) {
      case "greek":
        // Five equal squares.
        return "M-.166667-.5H.166667V-.166667H.5V.166667H.166667V.5H-.166667V.166667H-.5V-.166667H-.166667Z";

      case "swiss":
        // Swiss federal construction: arm width 6, arm extension 7, total 20.
        return "M-.15-.5H.15V-.15H.5V.15H.15V.5H-.15V.15H-.5V-.15H-.15Z";

      case "bolnisi":
        // Compact approximation of the flared Bolnisi cross used by Georgia.
        return "M-.26-.5H.26L.12-.12.5-.26V.26L.12.12.26.5H-.26L-.12.12-.5.26V-.26L-.12-.12Z";
    }
  }

  private radialPoints(
    shape: Extract<ShapeSpec, { type: "star" | "sun" }>,
  ): string {
    const count =
      shape.type === "star" ? (shape.points ?? 5) : (shape.rays ?? 12);
    const inner =
      0.5 * (shape.type === "star" ? (count === 5 ? 0.382 : 0.45) : 0.72);
    const points: string[] = [];

    for (let i = 0; i < count * 2; i++) {
      const r = i % 2 === 0 ? 0.5 : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / count;
      points.push(`${n(Math.cos(angle) * r)},${n(Math.sin(angle) * r)}`);
    }

    return points.join(" ");
  }

  private shapeKey(shape: Readonly<ShapeSpec>): string {
    switch (shape.type) {
      case "star":
        return `star:${shape.points ?? 5}`;
      case "sun":
        return `sun:${shape.rays ?? 12}`;
      case "cross":
        return `cross:${shape.style ?? "greek"}`;
      default:
        return shape.type;
    }
  }
}
