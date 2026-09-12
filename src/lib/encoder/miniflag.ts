import { decodeText, encodeText } from "./encode";
import { AspectRatioPart } from "./parts/AspectRatio";
import { LayersPart } from "./parts/Layers";
import { PalettePart } from "./parts/Palette";
import type { Bit, Context, ProtocolPart } from "../types";

/**
 * Main protocol reader/writer.
 *
 * Bit order is MSB-first within each byte. The wire payload is padded with
 * zero bits only at the very end so it can be transported as Base64.
 */
export default class MiniFlag {
  private buffer: number[] = [];
  private position = 0;
  private bitLength = 0;

  /** Top-level wire grammar. Array order is wire order. */
  public readonly parts: readonly ProtocolPart[] = [
    new AspectRatioPart(),
    new PalettePart(),
    new LayersPart(),
  ];

  public encode(context: Readonly<Context>) {
    this.beginWrite();

    for (const part of this.parts) {
      part.encode(this, context);
    }

    const bytes = Uint8Array.from(this.buffer);
    return {
      data: encodeText(bytes, this.bitLength),
      bitLength: this.bitLength,
    };
  }

  public decode(base64: string, requireExhausted = true): Context {
    const { bytes } = decodeText(base64);
    this.beginRead(bytes, bytes.length * 8);

    let context: Partial<Context> = {};

    for (const part of this.parts) {
      const decoded = part.decode(this, context);
      context = { ...context, ...decoded };
    }

    if (requireExhausted) {
      this.consumeFinalZeroPadding();
    }

    return context as Context;
  }

  public get bitPosition(): number {
    return this.position;
  }

  public get remainingBits(): number {
    return this.bitLength - this.position;
  }

  // -------------------------------------------------------------------------
  // Raw bits
  // -------------------------------------------------------------------------

  public writeBit(bit: Bit): void {
    const byteIndex = this.position >>> 3;
    const bitIndex = 7 - (this.position & 7);

    if (this.buffer[byteIndex] === undefined) {
      this.buffer[byteIndex] = 0;
    }

    if (bit === 1) {
      this.buffer[byteIndex] |= 1 << bitIndex;
    }

    this.position++;
    this.bitLength = this.position;
  }

  public readBit(): Bit {
    if (this.position >= this.bitLength) {
      throw new Error("Unexpected end of bitstream");
    }

    const byteIndex = this.position >>> 3;
    const bitIndex = 7 - (this.position & 7);
    const bit = (this.buffer[byteIndex] >>> bitIndex) & 1;

    this.position++;
    return bit as Bit;
  }

  public writeBits(bits: string): void {
    for (const char of bits) {
      if (char !== "0" && char !== "1") {
        throw new Error(`Invalid bit character: ${char}`);
      }

      this.writeBit(char === "1" ? 1 : 0);
    }
  }

  public readBits(count: number): string {
    this.assertSafeCount(count, "Bit count");

    let result = "";
    for (let i = 0; i < count; i++) {
      result += this.readBit() === 1 ? "1" : "0";
    }

    return result;
  }

  /** Reads one value from a prefix-free code table. */
  public readPrefix<T>(codeToValue: ReadonlyMap<string, T>): T {
    let prefix = "";

    while (true) {
      prefix += String(this.readBit());

      const value = codeToValue.get(prefix);
      if (value !== undefined) {
        return value;
      }

      let stillPossible = false;
      for (const code of codeToValue.keys()) {
        if (code.startsWith(prefix)) {
          stillPossible = true;
          break;
        }
      }

      if (!stillPossible) {
        throw new Error(`Invalid prefix code: ${prefix}`);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Fixed-width / bounded integers
  // -------------------------------------------------------------------------

  public writeUint(value: number, bits: number): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("Value must be a non-negative safe integer");
    }

    if (!Number.isSafeInteger(bits) || bits < 0 || bits > 52) {
      throw new Error("Bit width must be between 0 and 52");
    }

    if (bits === 0) {
      if (value !== 0) throw new Error("Only zero fits in 0 bits");
      return;
    }

    if (value >= 2 ** bits) {
      throw new Error(`${value} does not fit in ${bits} bits`);
    }

    for (let i = bits - 1; i >= 0; i--) {
      const bit = Math.floor(value / 2 ** i) % 2;
      this.writeBit(bit as Bit);
    }
  }

  public readUint(bits: number): number {
    if (!Number.isSafeInteger(bits) || bits < 0 || bits > 52) {
      throw new Error("Bit width must be between 0 and 52");
    }

    let value = 0;
    for (let i = 0; i < bits; i++) {
      value = value * 2 + this.readBit();
    }

    return value;
  }

  /**
   * Truncated-binary coding for a value in [0, count).
   *
   * Example for count=3:
   *   0 -> 0
   *   1 -> 10
   *   2 -> 11
   */
  public writeBoundedUint(value: number, count: number): void {
    if (
      !Number.isSafeInteger(value) ||
      !Number.isSafeInteger(count) ||
      count < 1 ||
      value < 0 ||
      value >= count
    ) {
      throw new Error(`Invalid bounded integer ${value}/${count}`);
    }

    if (count === 1) return;

    const bits = Math.ceil(Math.log2(count));
    const cutoff = 2 ** bits - count;

    if (value < cutoff) {
      this.writeUint(value, bits - 1);
    } else {
      this.writeUint(value + cutoff, bits);
    }
  }

  public readBoundedUint(count: number): number {
    if (!Number.isSafeInteger(count) || count < 1) {
      throw new Error(`Invalid bounded integer count: ${count}`);
    }

    if (count === 1) return 0;

    const bits = Math.ceil(Math.log2(count));
    const cutoff = 2 ** bits - count;
    const prefix = this.readUint(bits - 1);

    if (prefix < cutoff) {
      return prefix;
    }

    const lastBit = this.readBit();
    return prefix * 2 + lastBit - cutoff;
  }

  // -------------------------------------------------------------------------
  // Quantized geometry
  // -------------------------------------------------------------------------

  /** 5-bit value in [0,1], giving 32 representable positions/sizes. */
  public writeUnit5(value: number): void {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`Unit value must be in [0,1], got ${value}`);
    }

    this.writeUint(Math.round(value * 31), 5);
  }

  public readUnit5(): number {
    return this.readUint(5) / 31;
  }

  /** 4-bit full-turn angle, in 22.5-degree increments. */
  public writeAngle4(turns: number): void {
    if (!Number.isFinite(turns)) {
      throw new Error(`Invalid angle: ${turns}`);
    }

    const normalized = ((turns % 1) + 1) % 1;
    this.writeUint(Math.round(normalized * 16) & 0x0f, 4);
  }

  public readAngle4(): number {
    return this.readUint(4) / 16;
  }

  // -------------------------------------------------------------------------
  // Elias gamma
  // -------------------------------------------------------------------------

  /** Elias gamma coding for positive integers. */
  public writeGamma(value: bigint): void {
    if (value < 1n) {
      throw new Error("Elias gamma requires a value >= 1");
    }

    const binary = value.toString(2);

    for (let i = 1; i < binary.length; i++) {
      this.writeBit(0);
    }

    this.writeBits(binary);
  }

  public readGamma(): bigint {
    let leadingZeros = 0;

    while (this.readBit() === 0) {
      leadingZeros++;
    }

    let value = 1n;
    for (let i = 0; i < leadingZeros; i++) {
      value = (value << 1n) | BigInt(this.readBit());
    }

    return value;
  }

  private beginWrite(): void {
    this.buffer = [];
    this.position = 0;
    this.bitLength = 0;
  }

  private beginRead(bytes: Uint8Array, bitLength: number): void {
    this.buffer = Array.from(bytes);
    this.position = 0;
    this.bitLength = bitLength;
  }

  /**
   * Base64 transports whole bytes, while MiniFlag is bit-level. After all
   * self-delimiting top-level parts have decoded, only 0..7 zero bits may
   * remain as byte padding.
   */
  private consumeFinalZeroPadding(): void {
    const paddingBits = this.remainingBits;

    if (paddingBits >= 8) {
      throw new Error(`Protocol contains ${paddingBits} trailing bits`);
    }

    while (this.remainingBits > 0) {
      if (this.readBit() !== 0) {
        throw new Error("Protocol contains non-zero trailing padding");
      }
    }
  }

  private assertSafeCount(value: number, name: string): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`${name} must be a non-negative safe integer`);
    }
  }
}

export function gcd(a: bigint, b: bigint): bigint {
  if (a < 0n) a = -a;
  if (b < 0n) b = -b;

  while (b !== 0n) {
    [a, b] = [b, a % b];
  }

  return a;
}
