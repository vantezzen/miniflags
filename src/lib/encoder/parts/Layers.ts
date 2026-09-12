import type MiniFlag from "../miniflag";
import { ProtocolPart, type Context } from "../../types";
import { BandLayerCodec } from "./layers/BandLayer";
import { BuiltinLayerCodec } from "./layers/BuiltinLayer";
import { CrossLayerCodec } from "./layers/CrossLayer";
import { ExtensionLayerCodec } from "./layers/ExtensionLayer";
import { type LayerCodec, type LayerEnvironment } from "./layers/Layer";
import { RegionLayerCodec } from "./layers/RegionLayer";
import { ShapeLayerCodec } from "./layers/ShapeLayer";
import { StripesLayerCodec } from "./layers/StripesLayer";
import type { LayerDefinition } from "./layers/types";

const COUNT_TO_CODE = new Map<number, string>([
  [1, "0"],
  [2, "10"],
  [3, "110"],
  [4, "1110"],
  [5, "11110"],
  [6, "111110"],
]);
const CODE_TO_COUNT = new Map(
  [...COUNT_TO_CODE.entries()].map(([count, code]) => [code, count]),
);
const CUSTOM_COUNT_CODE = "111111";

/**
 * Top-level visual program. It owns the variable-length list of visual layers;
 * individual layer families remain separate codecs under parts/layers/.
 */
export class LayersPart extends ProtocolPart {
  private readonly codecs: readonly LayerCodec<LayerDefinition>[] = [
    new StripesLayerCodec(),
    new ShapeLayerCodec(),
    new RegionLayerCodec(),
    new CrossLayerCodec(),
    new BandLayerCodec(),
    new BuiltinLayerCodec(),
    new ExtensionLayerCodec(),
  ] as readonly LayerCodec<LayerDefinition>[];

  public constructor() {
    super("layers");
  }

  public encode(io: MiniFlag, context: Readonly<Context>): void {
    if (context.layers.length < 1) {
      throw new Error("A flag must contain at least one layer");
    }

    this.writeLayerCount(io, context.layers.length);
    const previousLayers: LayerDefinition[] = [];

    for (const layer of context.layers) {
      const codec = this.codecs.find((candidate) => candidate.matches(layer));
      if (!codec) throw new Error(`No codec for layer kind '${layer.kind}'`);

      io.writeBits(codec.code);
      const env: LayerEnvironment = { context, previousLayers };
      codec.encode(io, layer, env);
      previousLayers.push(layer);
    }
  }

  public decode(
    io: MiniFlag,
    context: Readonly<Partial<Context>>,
  ): Partial<Context> {
    const count = this.readLayerCount(io);
    const layers: LayerDefinition[] = [];

    const codeToCodec = new Map(
      this.codecs.map((codec) => [codec.code, codec] as const),
    );

    for (let i = 0; i < count; i++) {
      const codec = io.readPrefix(codeToCodec);
      const env: LayerEnvironment = { context, previousLayers: layers };
      layers.push(codec.decode(io, env));
    }

    return { layers };
  }

  private writeLayerCount(io: MiniFlag, count: number): void {
    const direct = COUNT_TO_CODE.get(count);
    if (direct !== undefined) {
      io.writeBits(direct);
      return;
    }

    io.writeBits(CUSTOM_COUNT_CODE);
    io.writeGamma(BigInt(count - 6));
  }

  private readLayerCount(io: MiniFlag): number {
    let prefix = "";
    const candidates = [...CODE_TO_COUNT.keys(), CUSTOM_COUNT_CODE];

    while (true) {
      prefix += String(io.readBit());
      const direct = CODE_TO_COUNT.get(prefix);
      if (direct !== undefined) return direct;

      if (prefix === CUSTOM_COUNT_CODE) {
        const extra = io.readGamma();
        const count = extra + 6n;
        if (count > BigInt(Number.MAX_SAFE_INTEGER))
          throw new Error("Layer count is too large");
        return Number(count);
      }

      if (!candidates.some((code) => code.startsWith(prefix))) {
        throw new Error(`Invalid layer-count prefix: ${prefix}`);
      }
    }
  }
}
