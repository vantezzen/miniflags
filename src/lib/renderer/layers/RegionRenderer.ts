import type { RegionLayerDefinition } from "../../encoder/parts/layers/types";
import { bounds, polygon, rect } from "../svg";
import type {
  LayerRenderResult,
  Rect,
  RenderScope,
  SvgRenderEnvironment,
} from "../types";
import { LayerRenderer } from "./LayerRenderer";

export class RegionRenderer extends LayerRenderer<RegionLayerDefinition> {
  public readonly kind = "region" as const;

  public render(
    layer: Readonly<RegionLayerDefinition>,
    env: SvgRenderEnvironment,
  ): LayerRenderResult {
    const { scope, geometry } = this.geometry(layer, env);
    const fill = this.color(env, layer.color);

    return {
      svg: this.paint(geometry, fill),
      regionScope: scope,
    };
  }

  private geometry(
    layer: Readonly<RegionLayerDefinition>,
    env: SvgRenderEnvironment,
  ): { scope: RenderScope; geometry: string } {
    const flag = env.flagScope.bounds;
    const region = layer.region;

    switch (region.type) {
      case "hoist-triangle": {
        const points = [
          { x: flag.x, y: flag.y },
          {
            x: flag.x + (region.apexX ?? 1 / 3) * flag.width,
            y: flag.y + (region.apexY ?? 1 / 2) * flag.height,
          },
          { x: flag.x, y: flag.y + flag.height },
        ];
        const geometry = polygon(points);
        return { scope: { bounds: bounds(points), clip: geometry }, geometry };
      }

      case "canton": {
        const box: Rect = {
          x: flag.x,
          y: flag.y,
          width: flag.width * (region.width ?? 1 / 2),
          height: flag.height * (region.height ?? 1 / 2),
        };
        const geometry = rect(box);
        return { scope: { bounds: box, clip: geometry }, geometry };
      }

      case "center-rect": {
        const width = flag.width * (region.width ?? 1 / 2);
        const height = flag.height * (region.height ?? 1 / 2);
        const box: Rect = {
          x: flag.x + (flag.width - width) / 2,
          y: flag.y + (flag.height - height) / 2,
          width,
          height,
        };
        const geometry = rect(box);
        return { scope: { bounds: box, clip: geometry }, geometry };
      }

      case "rectangle": {
        const box: Rect = {
          x: flag.x + region.x * flag.width,
          y: flag.y + region.y * flag.height,
          width: region.width * flag.width,
          height: region.height * flag.height,
        };
        const geometry = rect(box);
        return { scope: { bounds: box, clip: geometry }, geometry };
      }

      case "triangle": {
        const points = region.points.map((point) => ({
          x: flag.x + point.x * flag.width,
          y: flag.y + point.y * flag.height,
        }));
        const geometry = polygon(points);
        return { scope: { bounds: bounds(points), clip: geometry }, geometry };
      }

      case "diagonal-half": {
        const left = flag.x;
        const top = flag.y;
        const right = flag.x + flag.width;
        const bottom = flag.y + flag.height;

        const points =
          region.direction === "slash"
            ? region.side === 0
              ? [
                  { x: left, y: top },
                  { x: right, y: top },
                  { x: left, y: bottom },
                ]
              : [
                  { x: right, y: top },
                  { x: right, y: bottom },
                  { x: left, y: bottom },
                ]
            : region.side === 0
              ? [
                  { x: left, y: top },
                  { x: right, y: top },
                  { x: right, y: bottom },
                ]
              : [
                  { x: left, y: top },
                  { x: left, y: bottom },
                  { x: right, y: bottom },
                ];

        const geometry = polygon(points);
        return { scope: { bounds: flag, clip: geometry }, geometry };
      }
    }
  }

  private paint(geometry: string, fill: string): string {
    return geometry.replace("/>", ` fill="${fill}"/>`);
  }
}
