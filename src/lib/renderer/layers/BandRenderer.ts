import type {
  BandLayerDefinition,
  DiagonalDirection,
  Direction,
} from "../../encoder/parts/layers/types";
import { n } from "../svg";
import type { LayerRenderResult, Rect, SvgRenderEnvironment } from "../types";
import { LayerRenderer } from "./LayerRenderer";

const DEFAULT_WIDTH = 0.2;
const FIMBRIATION_SCALE = 1.5;

export class BandRenderer extends LayerRenderer<BandLayerDefinition> {
  public readonly kind = "band" as const;

  public render(
    layer: Readonly<BandLayerDefinition>,
    env: SvgRenderEnvironment,
  ): LayerRenderResult {
    const box = env.flagScope.bounds;
    const unit = layer.direction === "vertical" ? box.width : box.height;
    const width = unit * (layer.width ?? DEFAULT_WIDTH);

    let svg = "";
    if (layer.borderColor !== undefined) {
      svg += this.band(
        box,
        layer.direction,
        width * FIMBRIATION_SCALE,
        this.color(env, layer.borderColor),
      );
    }
    svg += this.band(box, layer.direction, width, this.color(env, layer.color));

    return { svg };
  }

  private band(
    box: Rect,
    direction: Direction | DiagonalDirection,
    width: number,
    fill: string,
  ): string {
    if (direction === "horizontal") {
      return `<rect x="${n(box.x)}" y="${n(box.y + (box.height - width) / 2)}" width="${n(box.width)}" height="${n(width)}" fill="${fill}"/>`;
    }

    if (direction === "vertical") {
      return `<rect x="${n(box.x + (box.width - width) / 2)}" y="${n(box.y)}" width="${n(width)}" height="${n(box.height)}" fill="${fill}"/>`;
    }

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

    return `<line x1="${n(x1 - ux * extension)}" y1="${n(y1 - uy * extension)}" x2="${n(x2 + ux * extension)}" y2="${n(y2 + uy * extension)}" stroke="${fill}" stroke-width="${n(width)}" stroke-linecap="square"/>`;
  }
}
