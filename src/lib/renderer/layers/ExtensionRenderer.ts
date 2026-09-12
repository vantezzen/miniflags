import type { ExtensionLayerDefinition } from "../../encoder/parts/layers/types";
import type { LayerRenderResult, SvgRenderEnvironment } from "../types";
import { LayerRenderer } from "./LayerRenderer";

export class ExtensionRenderer extends LayerRenderer<ExtensionLayerDefinition> {
  public readonly kind = "extension" as const;

  public render(
    layer: Readonly<ExtensionLayerDefinition>,
    _env: SvgRenderEnvironment,
  ): LayerRenderResult {
    throw new Error(`No SVG renderer for extension layer ${layer.typeId}`);
  }
}
