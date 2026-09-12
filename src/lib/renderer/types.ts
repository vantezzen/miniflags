import type { LayerDefinition } from "../encoder/parts/layers/types";
import type { Context } from "../types";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Local coordinate scope for a layer. `clip` contains geometry without paint
 * attributes and is only materialized into a <clipPath> if a later layer uses
 * this scope.
 */
export interface RenderScope {
  readonly bounds: Rect;
  readonly clip?: string;
}

export interface SvgRenderEnvironment {
  readonly context: Readonly<Context>;
  readonly flagScope: RenderScope;
  readonly previousLayer?: LayerDefinition;
  readonly previousRegionScope?: RenderScope;

  /** Wraps SVG content in the scope's clip path when one exists. */
  clip(scope: RenderScope, svg: string): string;

  /** Adds reusable SVG geometry to <defs> and returns its stable local ID. */
  define(key: string, svg: string): string;
}

export interface LayerRenderResult {
  readonly svg: string;

  /** Set by region layers so the immediately following layer can target it. */
  readonly regionScope?: RenderScope;
}
