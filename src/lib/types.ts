import type MiniFlag from "./encoder/miniflag";
import type { AspectRatio } from "./encoder/parts/AspectRatio";
import type { LayerDefinition } from "./encoder/parts/layers/types";

export type Bit = 0 | 1;

export interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface Context {
  aspectRatio: AspectRatio;
  palette: readonly Color[];
  layers: readonly LayerDefinition[];
}

export abstract class ProtocolPart {
  // @ts-expect-error erasableSyntaxOnly
  public constructor(public readonly name: string) {}

  public abstract encode(io: MiniFlag, context: Readonly<Context>): void;

  public abstract decode(
    io: MiniFlag,
    context: Readonly<Partial<Context>>,
  ): Partial<Context>;
}
