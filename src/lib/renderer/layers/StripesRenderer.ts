import type { StripesLayerDefinition } from "../../encoder/parts/layers/types";
import { n } from "../svg";
import type { LayerRenderResult, SvgRenderEnvironment } from "../types";
import { LayerRenderer } from "./LayerRenderer";

export class StripesRenderer extends LayerRenderer<StripesLayerDefinition> {
  public readonly kind = "stripes" as const;

  public render(
    layer: Readonly<StripesLayerDefinition>,
    env: SvgRenderEnvironment,
  ): LayerRenderResult {
    const box = env.flagScope.bounds;
    const weights = layer.stripes.map((stripe) => stripe.weight ?? 1);
    const total = weights.reduce((sum, weight) => sum + weight, 0);

    if (total <= 0)
      throw new Error("Stripe weights must sum to a positive value");

    let cursor = layer.direction === "horizontal" ? box.y : box.x;
    let svg = "";

    layer.stripes.forEach((stripe, index) => {
      const final = index === layer.stripes.length - 1;
      const extent =
        ((layer.direction === "horizontal" ? box.height : box.width) *
          weights[index]) /
        total;
      const fill = this.color(env, stripe.color);

      if (layer.direction === "horizontal") {
        const end = final ? box.y + box.height : cursor + extent;
        svg += `<rect x="${n(box.x)}" y="${n(cursor)}" width="${n(box.width)}" height="${n(end - cursor)}" fill="${fill}"/>`;
        cursor = end;
      } else {
        const end = final ? box.x + box.width : cursor + extent;
        svg += `<rect x="${n(cursor)}" y="${n(box.y)}" width="${n(end - cursor)}" height="${n(box.height)}" fill="${fill}"/>`;
        cursor = end;
      }
    });

    return { svg };
  }
}
