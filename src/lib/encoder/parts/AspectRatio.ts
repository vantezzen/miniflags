import type MiniFlag from "../miniflag";
import { gcd } from "../miniflag";
import { ProtocolPart, type Context } from "../../types";

export interface RationalAspectRatio {
  readonly kind: "rational";

  /**
   * Height component.
   *
   * Example:
   *   2:3 => height = 2n
   */
  readonly height: bigint;

  /**
   * Width component.
   *
   * Example:
   *   2:3 => width = 3n
   */
  readonly width: bigint;
}

export interface PhiAspectRatio {
  readonly kind: "phi";
}

export type AspectRatio = RationalAspectRatio | PhiAspectRatio;

const DIRECT_CODES = new Map<string, string>([
  ["2:3", "0"],
  ["1:2", "10"],

  ["3:5", "1100"],
  ["5:8", "11010"],

  ["10:19", "110110"],
  ["3:4", "110111"],
  ["4:7", "111000"],

  ["1:1", "1110010"],
  ["7:10", "1110011"],
  ["8:11", "1110100"],
  ["11:18", "1110101"],
  ["11:20", "1110110"],
  ["11:28", "1110111"],
  ["18:25", "1111000"],
  ["1:phi", "1111001"],
  ["4:5", "1111010"],
  ["6:7", "1111011"],

  ["10:17", "11111000"],
  ["13:15", "11111001"],
  ["15:22", "11111010"],
  ["16:25", "11111011"],
  ["189:335", "11111100"],
  ["28:37", "11111101"],
  ["5:7", "11111110"],

  ["7:11", "111111110"],
]);

const CUSTOM_CODE = "111111111";

const CODE_TO_RATIO = new Map<string, string>(
  [...DIRECT_CODES.entries()].map(([ratio, code]) => [code, ratio]),
);

export class AspectRatioPart extends ProtocolPart {
  public constructor() {
    super("aspectRatio");
  }

  public encode(io: MiniFlag, context: Readonly<Context>): void {
    const ratio = context.aspectRatio;

    if (ratio.kind === "phi") {
      io.writeBits(this.requiredDirectCode("1:phi"));

      return;
    }

    let height = ratio.height;
    let width = ratio.width;

    if (height < 1n || width < 1n) {
      throw new Error("Aspect ratio components must be positive");
    }

    if (height > width) {
      throw new Error("AR1 requires height <= width");
    }

    // Canonicalize automatically.
    const divisor = gcd(height, width);

    height /= divisor;
    width /= divisor;

    const key = this.ratioKey(height, width);

    const directCode = DIRECT_CODES.get(key);

    if (directCode !== undefined) {
      io.writeBits(directCode);
      return;
    }

    // Custom
    io.writeBits(CUSTOM_CODE);

    io.writeGamma(height);

    const widthDeltaPlusOne = width - height + 1n;

    io.writeGamma(widthDeltaPlusOne);
  }

  public decode(io: MiniFlag): Partial<Context> {
    let prefix = "";

    while (true) {
      prefix += String(io.readBit());

      if (prefix === CUSTOM_CODE) {
        const height = io.readGamma();

        const widthDeltaPlusOne = io.readGamma();

        const width = height + widthDeltaPlusOne - 1n;

        if (height > width) {
          throw new Error(`Invalid AR1 ratio ${height}:${width}`);
        }

        if (gcd(height, width) !== 1n) {
          throw new Error(
            `Non-canonical custom aspect ratio: ` + `${height}:${width}`,
          );
        }

        const key = this.ratioKey(height, width);

        if (DIRECT_CODES.has(key)) {
          throw new Error(
            `Non-canonical custom aspect ratio ${key}: ` +
              `a direct AR1 code exists`,
          );
        }

        return {
          aspectRatio: {
            kind: "rational",
            height,
            width,
          },
        } as Partial<Context>;
      }

      const direct = CODE_TO_RATIO.get(prefix);

      if (direct !== undefined) {
        if (direct === "1:phi") {
          return {
            aspectRatio: {
              kind: "phi",
            },
          } as Partial<Context>;
        }

        const [heightText, widthText] = direct.split(":");

        return {
          aspectRatio: {
            kind: "rational",
            height: BigInt(heightText),
            width: BigInt(widthText),
          },
        } as Partial<Context>;
      }
    }
  }

  ratioKey(height: bigint, width: bigint): string {
    return `${height}:${width}`;
  }

  requiredDirectCode(ratio: string): string {
    const code = DIRECT_CODES.get(ratio);

    if (code === undefined) {
      throw new Error(`Missing AR1 direct code for ${ratio}`);
    }

    return code;
  }
}
