import type { AspectRatio } from "../encoder/parts/AspectRatio";
import type { LayerDefinition } from "../encoder/parts/layers/types";
import type { Context } from "../types";
import { hash, n } from "./svg";
import {
  BandRenderer,
  BuiltinRenderer,
  CrossRenderer,
  ExtensionRenderer,
  type LayerRenderer,
  RegionRenderer,
  ShapeRenderer,
  StripesRenderer,
} from "./layers";
import type { RenderScope, SvgRenderEnvironment } from "./types";

const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * Pure SVG renderer for a decoded MiniFlag context.
 *
 * There are no pixel dimensions and no DOM dependency. The output is a
 * standalone SVG string with a unit-height viewBox and can be scaled by the
 * browser to any final size.
 */
export default class MiniFlagSvgRenderer {
  private readonly layerRenderers = [
    new StripesRenderer(),
    new ShapeRenderer(),
    new RegionRenderer(),
    new CrossRenderer(),
    new BandRenderer(),
    new BuiltinRenderer(),
    new ExtensionRenderer(),
  ] as readonly LayerRenderer<LayerDefinition>[];

  public render(context: Readonly<Context>): string {
    this.validate(context);

    const width = this.widthOverHeight(context.aspectRatio);
    const flagScope: RenderScope = {
      bounds: { x: 0, y: 0, width, height: 1 },
    };

    const defs = new Map<string, string>();
    const define = (key: string, svg: string): string => {
      const id = `d${hash(key)}`;
      if (!defs.has(id)) defs.set(id, `<g id="${id}">${svg}</g>`);
      return id;
    };

    const clip = (scope: RenderScope, svg: string): string => {
      if (!scope.clip) return svg;

      const id = `c${hash(scope.clip)}`;
      if (!defs.has(id))
        defs.set(id, `<clipPath id="${id}">${scope.clip}</clipPath>`);
      return `<g clip-path="url(#${id})">${svg}</g>`;
    };

    let previousLayer: LayerDefinition | undefined;
    let previousRegionScope: RenderScope | undefined;
    let body = "";

    for (const layer of context.layers) {
      const renderer = this.layerRenderers.find((candidate) =>
        candidate.matches(layer),
      );
      if (!renderer)
        throw new Error(`No SVG renderer for layer '${layer.kind}'`);

      const env: SvgRenderEnvironment = {
        context,
        flagScope,
        previousLayer,
        previousRegionScope,
        clip,
        define,
      };

      const result = renderer.render(layer, env);
      body += result.svg;
      previousRegionScope =
        layer.kind === "region" ? result.regionScope : undefined;
      previousLayer = layer;
    }

    const defsSvg =
      defs.size > 0 ? `<defs>${[...defs.values()].join("")}</defs>` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(width)} 1">${defsSvg}${body}</svg>`;
  }

  private widthOverHeight(ratio: AspectRatio): number {
    if (ratio.kind === "phi") return PHI;

    const scale = 1_000_000_000n;
    const scaled = (ratio.width * scale) / ratio.height;
    const result = Number(scaled) / Number(scale);

    if (!Number.isFinite(result) || result <= 0) {
      throw new Error("Aspect ratio is too large to render safely");
    }

    return result;
  }

  private validate(context: Readonly<Context>): void {
    if (context.palette.length < 1)
      throw new Error("Cannot render an empty palette");
    if (context.layers.length < 1)
      throw new Error("Cannot render a flag without layers");
  }
}
