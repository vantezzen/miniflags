import type {
  BuiltinLayerDefinition,
  BuiltinPlacement,
} from "../../encoder/parts/layers/types";
import { n } from "../svg";
import type {
  LayerRenderResult,
  Rect,
  RenderScope,
  SvgRenderEnvironment,
} from "../types";
import { LayerRenderer } from "./LayerRenderer";

export class BuiltinRenderer extends LayerRenderer<BuiltinLayerDefinition> {
  public readonly kind = "builtin" as const;

  public render(
    layer: Readonly<BuiltinLayerDefinition>,
    env: SvgRenderEnvironment,
  ): LayerRenderResult {
    if (layer.builtin !== "union-jack") {
      throw new Error(`No SVG renderer for builtin ${layer.builtin.id}`);
    }

    const scope = this.placement(layer.placement ?? { type: "full" }, env);
    return { svg: env.clip(scope, this.unionJack(scope.bounds)) };
  }

  private placement(
    placement: BuiltinPlacement,
    env: SvgRenderEnvironment,
  ): RenderScope {
    const flag = env.flagScope.bounds;

    switch (placement.type) {
      case "full":
        return env.flagScope;

      case "previous-region":
        return this.scope(env, "previous-region");

      case "canton": {
        const box = {
          x: flag.x,
          y: flag.y,
          width: flag.width / 2,
          height: flag.height / 2,
        };
        return { bounds: box, clip: this.rectGeometry(box) };
      }

      case "rectangle": {
        const box = {
          x: flag.x + placement.x * flag.width,
          y: flag.y + placement.y * flag.height,
          width: placement.width * flag.width,
          height: placement.height * flag.height,
        };
        return { bounds: box, clip: this.rectGeometry(box) };
      }
    }
  }

  private unionJack(box: Rect): string {
    const blue = "#012169";
    const white = "#fff";
    const red = "#c8102e";

    return (
      `<rect x="${n(box.x)}" y="${n(box.y)}" width="${n(box.width)}" height="${n(box.height)}" fill="${blue}"/>` +
      this.diagonal(box, "slash", box.height * 0.18, white) +
      this.diagonal(box, "backslash", box.height * 0.18, white) +
      this.diagonal(box, "slash", box.height * 0.075, red) +
      this.diagonal(box, "backslash", box.height * 0.075, red) +
      `<rect x="${n(box.x)}" y="${n(box.y + box.height * 0.4)}" width="${n(box.width)}" height="${n(box.height * 0.2)}" fill="${white}"/>` +
      `<rect x="${n(box.x + box.width * 0.45)}" y="${n(box.y)}" width="${n(box.width * 0.1)}" height="${n(box.height)}" fill="${white}"/>` +
      `<rect x="${n(box.x)}" y="${n(box.y + box.height * 0.44)}" width="${n(box.width)}" height="${n(box.height * 0.12)}" fill="${red}"/>` +
      `<rect x="${n(box.x + box.width * 0.47)}" y="${n(box.y)}" width="${n(box.width * 0.06)}" height="${n(box.height)}" fill="${red}"/>`
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
    return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${n(width)}" stroke-linecap="square"/>`;
  }

  private rectGeometry(box: Rect): string {
    return `<rect x="${n(box.x)}" y="${n(box.y)}" width="${n(box.width)}" height="${n(box.height)}"/>`;
  }
}
