import type { Color } from "../types";
import type { Rect } from "./types";

/** Compact, deterministic decimal formatting for SVG attributes. */
export function n(value: number): string {
  if (!Number.isFinite(value)) throw new Error(`Invalid SVG number: ${value}`);
  if (Object.is(value, -0)) value = 0;
  return String(Number(value.toFixed(6)));
}

/** Uses #rgb where possible, otherwise #rrggbb. */
export function color(color: Color): string {
  const hex = [color.r, color.g, color.b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

  if (hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5]) {
    return `#${hex[0]}${hex[2]}${hex[4]}`;
  }

  return `#${hex}`;
}

export function rect(rect: Rect, fill?: string): string {
  return `<rect x="${n(rect.x)}" y="${n(rect.y)}" width="${n(rect.width)}" height="${n(rect.height)}"${fill ? ` fill="${fill}"` : ""}/>`;
}

export function polygon(
  points: readonly { x: number; y: number }[],
  fill?: string,
): string {
  const value = points.map((point) => `${n(point.x)},${n(point.y)}`).join(" ");
  return `<polygon points="${value}"${fill ? ` fill="${fill}"` : ""}/>`;
}

export function bounds(points: readonly { x: number; y: number }[]): Rect {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return { x, y, width: right - x, height: bottom - y };
}

export function minDimension(rect: Rect): number {
  return Math.min(rect.width, rect.height);
}

/**
 * Stable short hash used only for local SVG definition IDs.
 * The hash is derived from the geometry itself, so separately rendered SVGs
 * with the same ID also have the same clip geometry.
 */
export function hash(value: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function toImgString(svg: string): string {
  if (!svg) {
    return "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
