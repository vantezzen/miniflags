export interface BitData {
  bytes: Uint8Array;
  bitLength: number;
}

const BASE = 94n;
const FIRST_CHAR = 33; // "!"
const LAST_CHAR = 126; // "~"

export function encodeText(bytes: Uint8Array, bitLength: number): string {
  if (
    !Number.isSafeInteger(bitLength) ||
    bitLength < 0 ||
    bitLength > bytes.length * 8
  ) {
    throw new Error("Invalid bitLength");
  }

  if (bitLength === 0) {
    return "";
  }

  let value = 0n;

  for (let i = 0; i < bitLength; i++) {
    const byteIndex = i >>> 3;
    const bitIndex = 7 - (i & 7);

    const bit = (bytes[byteIndex] >>> bitIndex) & 1;

    value = (value << 1n) | BigInt(bit);
  }

  /*
   * Rank all possible bit strings by length:
   *
   *   ""    -> 0
   *
   *   "0"   -> 1
   *   "1"   -> 2
   *
   *   "00"  -> 3
   *   "01"  -> 4
   *   "10"  -> 5
   *   "11"  -> 6
   *
   *   ...
   *
   * This makes bitLength recoverable without storing it.
   */
  let rank = (1n << BigInt(bitLength)) - 1n + value;

  let text = "";

  while (rank > 0n) {
    const digit = Number(rank % BASE);

    text = String.fromCharCode(FIRST_CHAR + digit) + text;

    rank /= BASE;
  }

  return text;
}

/**
 * Decode compact Base94 text back into the exact original bitstream.
 */
export function decodeText(text: string): BitData {
  if (text.length === 0) {
    return {
      bytes: new Uint8Array(0),
      bitLength: 0,
    };
  }

  let rank = 0n;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);

    if (code < FIRST_CHAR || code > LAST_CHAR) {
      throw new Error(`Invalid MiniFlag text character at index ${i}`);
    }

    rank = rank * BASE + BigInt(code - FIRST_CHAR);
  }

  /*
   * rank + 1 is in:
   *
   *   [2^n, 2^(n+1))
   *
   * Therefore:
   *
   *   n = floor(log2(rank + 1))
   */
  const bitLength = (rank + 1n).toString(2).length - 1;

  const offset = (1n << BigInt(bitLength)) - 1n;

  const value = rank - offset;

  const bytes = new Uint8Array(Math.ceil(bitLength / 8));

  for (let i = 0; i < bitLength; i++) {
    const shift = BigInt(bitLength - i - 1);

    const bit = Number((value >> shift) & 1n);

    if (bit) {
      const byteIndex = i >>> 3;

      const bitIndex = 7 - (i & 7);

      bytes[byteIndex] |= 1 << bitIndex;
    }
  }

  return {
    bytes,
    bitLength,
  };
}
