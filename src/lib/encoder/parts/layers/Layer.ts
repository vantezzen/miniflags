import type MiniFlag from "../../miniflag";
import type { Context } from "../../../types";
import type { LayerDefinition } from "./types";

export interface LayerEnvironment {
  readonly context: Readonly<Partial<Context>>;
  readonly previousLayers: readonly LayerDefinition[];
}

/** Base class for one wire-level layer family. */
export abstract class LayerCodec<TLayer extends LayerDefinition> {
  public abstract readonly kind: TLayer["kind"];
  public abstract readonly code: string;

  public matches(layer: LayerDefinition): layer is TLayer {
    return layer.kind === this.kind;
  }

  public abstract encode(
    io: MiniFlag,
    layer: Readonly<TLayer>,
    env: LayerEnvironment,
  ): void;

  public abstract decode(io: MiniFlag, env: LayerEnvironment): TLayer;

  protected paletteSize(env: LayerEnvironment): number {
    const palette = env.context.palette;

    if (!palette || palette.length < 1) {
      throw new Error("Layers require a non-empty decoded color palette");
    }

    return palette.length;
  }

  protected writeColor(
    io: MiniFlag,
    env: LayerEnvironment,
    color: number,
  ): void {
    io.writeBoundedUint(color, this.paletteSize(env));
  }

  protected readColor(io: MiniFlag, env: LayerEnvironment): number {
    return io.readBoundedUint(this.paletteSize(env));
  }

  protected validatePreviousRegion(env: LayerEnvironment): void {
    const previous = env.previousLayers.at(-1);

    if (previous?.kind !== "region") {
      throw new Error(
        "Layer scope 'previous-region' requires the immediately preceding layer to be a region",
      );
    }
  }

  protected writeScope(
    io: MiniFlag,
    env: LayerEnvironment,
    scope: "flag" | "previous-region" = "flag",
  ): void {
    if (scope === "previous-region") {
      this.validatePreviousRegion(env);
      io.writeBit(1);
    } else {
      io.writeBit(0);
    }
  }

  protected readScope(
    io: MiniFlag,
    env: LayerEnvironment,
  ): "flag" | "previous-region" {
    if (io.readBit() === 0) {
      return "flag";
    }

    this.validatePreviousRegion(env);
    return "previous-region";
  }
}

export function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive safe integer`);
  }
}

export function assertUnit(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be in [0,1]`);
  }
}
