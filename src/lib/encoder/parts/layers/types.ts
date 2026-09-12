export type Direction = "horizontal" | "vertical";
export type DiagonalDirection = "slash" | "backslash";
export type LayerScope = "flag" | "previous-region";

export interface Stripe {
  readonly color: number;
  readonly weight?: number;
}

export interface StripesLayerDefinition {
  readonly kind: "stripes";
  readonly direction: Direction;
  readonly stripes: readonly Stripe[];
}

export type CrossShapeStyle = "greek" | "swiss" | "bolnisi";

export type ShapeSpec =
  | { readonly type: "star"; readonly points?: number }
  | { readonly type: "disc" }
  | { readonly type: "crescent" }
  | { readonly type: "sun"; readonly rays?: number }
  | { readonly type: "diamond" }
  | { readonly type: "cross"; readonly style?: CrossShapeStyle };

export interface ShapePoint {
  readonly x: number;
  readonly y: number;
  readonly size?: number;
  readonly rotation?: number;
}

export type ShapePlacement =
  | { readonly type: "center" }
  | {
      readonly type: "custom";
      readonly scope?: LayerScope;
      readonly x?: number;
      readonly y?: number;
      readonly size?: number;
      readonly rotation?: number;
    }
  | {
      readonly type: "ring";
      readonly scope?: LayerScope;
      readonly count: number;
      readonly x?: number;
      readonly y?: number;
      readonly size?: number;
      readonly rotation?: number;
    }
  | { readonly type: "us50" }
  | {
      readonly type: "grid";
      readonly scope?: LayerScope;
      readonly rows: number;
      readonly columns: number;
      readonly x?: number;
      readonly y?: number;
      readonly width?: number;
      readonly height?: number;
    }
  | {
      readonly type: "points";
      readonly scope?: LayerScope;
      readonly points: readonly ShapePoint[];
      readonly defaultSize?: number;
    };

export interface ShapeLayerDefinition {
  readonly kind: "shape";
  readonly shape: ShapeSpec;
  readonly color: number;
  readonly borderColor?: number;
  readonly placement?: ShapePlacement;
}

export type RegionSpec =
  | {
      readonly type: "hoist-triangle";
      readonly apexX?: number;
      readonly apexY?: number;
    }
  | {
      readonly type: "canton";
      readonly width?: number;
      readonly height?: number;
    }
  | {
      readonly type: "diagonal-half";
      readonly direction: DiagonalDirection;
      readonly side: 0 | 1;
    }
  | {
      readonly type: "center-rect";
      readonly width?: number;
      readonly height?: number;
    }
  | {
      readonly type: "rectangle";
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
    }
  | {
      readonly type: "triangle";
      readonly points: readonly [ShapePoint, ShapePoint, ShapePoint];
    };

export interface RegionLayerDefinition {
  readonly kind: "region";
  readonly color: number;
  readonly region: RegionSpec;
}

export type CrossStyle =
  | "nordic"
  | "centered"
  | "centered-in-previous-region"
  | "saltire"
  | "saltire-in-previous-region";

export interface CrossLayerDefinition {
  readonly kind: "cross";
  readonly style: CrossStyle;
  readonly color: number;
  readonly borderColor?: number;
  readonly width?: number;
  readonly offset?: number;
}

export interface BandLayerDefinition {
  readonly kind: "band";
  readonly direction: Direction | DiagonalDirection;
  readonly color: number;
  readonly borderColor?: number;
  readonly width?: number;
}

export type BuiltinPlacement =
  | { readonly type: "full" }
  | { readonly type: "canton" }
  | { readonly type: "previous-region" }
  | {
      readonly type: "rectangle";
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
    };

export interface BuiltinLayerDefinition {
  readonly kind: "builtin";
  readonly builtin: "union-jack" | { readonly id: bigint };
  readonly placement?: BuiltinPlacement;
}

export interface ExtensionLayerDefinition {
  readonly kind: "extension";
  readonly typeId: bigint;
  /** Raw payload bits, without the extension framing. */
  readonly payload: string;
}

export type LayerDefinition =
  | StripesLayerDefinition
  | ShapeLayerDefinition
  | RegionLayerDefinition
  | CrossLayerDefinition
  | BandLayerDefinition
  | BuiltinLayerDefinition
  | ExtensionLayerDefinition;
