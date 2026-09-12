import type { CrossLayerDefinition } from "../../encoder/parts/layers/types";
import { n, minDimension } from "../svg";
import type {
  LayerRenderResult,
  Rect,
  RenderScope,
  SvgRenderEnvironment,
} from "../types";
import { LayerRenderer } from "./LayerRenderer";

const DEFAULT_WIDTH = 0.12;
const DEFAULT_NORDIC_OFFSET = 1 / 3;
const FIMBRIATION_SCALE = 1.5;

export class CrossRenderer extends LayerRenderer<CrossLayerDefinition> {
  public readonly kind = "cross" as const;

  public render(
    layer: Readonly<CrossLayerDefinition>,
    env: SvgRenderEnvironment,
  ): LayerRenderResult {
    const scoped = layer.style.includes("previous-region");
    const scope = this.scope(env, scoped ? "previous-region" : "flag");
    const width = minDimension(scope.bounds) * (layer.width ?? DEFAULT_WIDTH);

    let svg = "";
    if (layer.borderColor !== undefined) {
      svg += this.cross(
        layer,
        scope,
        width * FIMBRIATION_SCALE,
        this.color(env, layer.borderColor),
      );
    }
    svg += this.cross(layer, scope, width, this.color(env, layer.color));

    return { svg: env.clip(scope, svg) };
  }

  private cross(
    layer: Readonly<CrossLayerDefinition>,
    scope: RenderScope,
    width: number,
    fill: string,
  ): string {
    const box = scope.bounds;

    if (
      layer.style === "saltire" ||
      layer.style === "saltire-in-previous-region"
    ) {
      return (
        this.diagonal(box, "slash", width, fill) +
        this.diagonal(box, "backslash", width, fill)
      );
    }

    const verticalX =
      layer.style === "nordic"
        ? box.x + box.width * (layer.offset ?? DEFAULT_NORDIC_OFFSET)
        : box.x + box.width / 2;

    return (
      `<rect x="${n(box.x)}" y="${n(box.y + (box.height - width) / 2)}" width="${n(box.width)}" height="${n(width)}" fill="${fill}"/>` +
      `<rect x="${n(verticalX - width / 2)}" y="${n(box.y)}" width="${n(width)}" height="${n(box.height)}" fill="${fill}"/>`
    );
  }

  private diagonal(
    box: Rect,
    direction: "slash" | "backslash",
    width: number,
    color: string,
  ): string {
    const x1 = box.x;
    const y1 = direction === "slash" ? box.y + box.height : box.y;
    const x2 = box.x + box.width;
    const y2 = direction === "slash" ? box.y : box.y + box.height;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const ux = dx / length;
    const uy = dy / length;
    const extension = Math.max(box.width, box.height);

    return `<line x1="${n(x1 - ux * extension)}" y1="${n(y1 - uy * extension)}" x2="${n(x2 + ux * extension)}" y2="${n(y2 + uy * extension)}" stroke="${color}" stroke-width="${n(width)}" stroke-linecap="square"/>`;
  }
}
