import type {
  LayerDefinition,
  LayerScope,
} from "../../encoder/parts/layers/types";
import { color as colorToSvg, minDimension } from "../svg";
import type {
  LayerRenderResult,
  RenderScope,
  SvgRenderEnvironment,
} from "../types";

export abstract class LayerRenderer<TLayer extends LayerDefinition> {
  public abstract readonly kind: TLayer["kind"];

  public matches(layer: LayerDefinition): layer is TLayer {
    return layer.kind === this.kind;
  }

  public abstract render(
    layer: Readonly<TLayer>,
    env: SvgRenderEnvironment,
  ): LayerRenderResult;

  protected color(env: SvgRenderEnvironment, index: number): string {
    const value = env.context.palette[index];
    if (!value) throw new Error(`Palette index ${index} is out of range`);
    return colorToSvg(value);
  }

  protected scope(
    env: SvgRenderEnvironment,
    requested: LayerScope = "flag",
  ): RenderScope {
    if (requested === "flag") return env.flagScope;

    if (!env.previousRegionScope || env.previousLayer?.kind !== "region") {
      throw new Error(
        "Renderer scope 'previous-region' requires the immediately preceding layer to be a region",
      );
    }

    return env.previousRegionScope;
  }

  protected size(scope: RenderScope, normalized: number): number {
    return minDimension(scope.bounds) * normalized;
  }
}
