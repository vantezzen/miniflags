import type MiniFlag from "../../miniflag";
import { LayerCodec, type LayerEnvironment } from "./Layer";
import type { ExtensionLayerDefinition } from "./types";

/**
 * Forward-compatible escape layer.
 *
 * Payload length is explicit so an implementation can preserve/skip an
 * unknown extension without understanding its internal format.
 */
export class ExtensionLayerCodec extends LayerCodec<ExtensionLayerDefinition> {
  public readonly kind = "extension" as const;
  public readonly code = "111111";

  public encode(
    io: MiniFlag,
    layer: Readonly<ExtensionLayerDefinition>,
    _env: LayerEnvironment,
  ): void {
    if (layer.typeId < 1n) throw new Error("Extension typeId must be >= 1");
    if (!/^[01]*$/.test(layer.payload))
      throw new Error("Extension payload must contain bits only");

    io.writeGamma(layer.typeId);
    io.writeGamma(BigInt(layer.payload.length + 1));
    io.writeBits(layer.payload);
  }

  public decode(
    io: MiniFlag,
    _env: LayerEnvironment,
  ): ExtensionLayerDefinition {
    const typeId = io.readGamma();
    const encodedLength = io.readGamma();
    const payloadLength = encodedLength - 1n;

    if (payloadLength > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error("Extension payload is too large");
    }

    return {
      kind: "extension",
      typeId,
      payload: io.readBits(Number(payloadLength)),
    };
  }
}
