# miniflags format

## Acceptance

- The flag has to be "recognizable enough"
  - Details don't have to be _exactly_ correct. Small deviations, inaccuracies are ok - as long as somebody can look at it and say "Ah that's that flag!"
- Only country flags
  - No state flags, city flags, or other vexillological designs
- Not Nepal...
- Very simple flags should cost only a handful of layer bits, while uncommon geometry remains representable through quantized generic modes and extensions

## What makes a flag a flag?

1. Clean stripes
   - Germany, France, Italy
   - Horizontal or vertical
2. Eneven stripes
   - Cabo Verde, Cambodia
3. x plus left color triangle
   - Comoros, Bahamas
4. x plus top left corner different
   - US, Greece
   - Union Jack (New Zealand, Australia)
5. x plus common “modifier”
   - Star (Vietnam, Burkina Faso, Cameroon)
   - Sickle (Libya, Malaysia, Maldives, Pakistan (Rotated))
6. The nordic countries
   - "Plus/cross" flag

## What defines a flag?

- Aspect ratio
- Color palette
- Base stripes
  - Mode = uneven/even (1 bit)
- (Optional) Additions
  - Static: Color triangle, Union Jack corner
  - Dynamic: Star, Sickle

The bitstream is encoded to a custom Base91 for transport. Bits are written MSB-first
inside each byte. The logical protocol is not byte-aligned: one part starts on
the bit immediately following the previous part.

The format favors prefix-free, Huffman-style codes for common values and
uses Elias gamma coding or small fixed quantizers for uncommon/custom values.

## Top-level grammar

```text
AspectRatio
Palette
Layers
```

## Generic primitives

### Elias gamma

Positive integers only:

| Value | Bits    |
| ----: | :------ |
|     1 | `1`     |
|     2 | `010`   |
|     3 | `011`   |
|     4 | `00100` |
|     5 | `00101` |

### Bounded integer

For a known symbol count `N`, truncated binary encodes a value in `[0,N)`.
This is used for palette references. For a palette of three colors:

```text
palette[0] = 0
palette[1] = 10
palette[2] = 11
```

Palette order therefore affects compression. Encoders should put frequently
referenced colors first when they are free to choose palette order.

### Unit5

Normalized geometry values in `[0,1]` are quantized to five bits:

```text
encoded = round(value * 31)
decoded = encoded / 31
```

This provides 32 positions/sizes and about 3.2% spacing.

### Angle4

Angles are represented as fractions of a full turn using four bits, giving
16 orientations in 22.5-degree increments.

---

# 1. Aspect ratio

Ratios are written as `height:width` and rational values are reduced before
encoding. For example, `6:9` is canonicalized to `2:3`.

Common ratios use a frozen prefix codebook:

| Ratio   | Bits        |
| :------ | :---------- |
| 2:3     | `0`         |
| 1:2     | `10`        |
| 3:5     | `1100`      |
| 5:8     | `11010`     |
| 10:19   | `110110`    |
| 3:4     | `110111`    |
| 4:7     | `111000`    |
| 1:1     | `1110010`   |
| 7:10    | `1110011`   |
| 8:11    | `1110100`   |
| 11:18   | `1110101`   |
| 11:20   | `1110110`   |
| 11:28   | `1110111`   |
| 18:25   | `1111000`   |
| 1:φ     | `1111001`   |
| 4:5     | `1111010`   |
| 6:7     | `1111011`   |
| 10:17   | `11111000`  |
| 13:15   | `11111001`  |
| 15:22   | `11111010`  |
| 16:25   | `11111011`  |
| 189:335 | `11111100`  |
| 28:37   | `11111101`  |
| 5:7     | `11111110`  |
| 7:11    | `111111110` |
| CUSTOM  | `111111111` |

A custom rational ratio is:

```text
111111111 gamma(H) gamma(W - H + 1)
```

The ratio must be reduced and must not duplicate a direct code. Togo's `1:φ`
is a direct symbolic value because the custom path represents rationals only.

---

# 2. Color palette

The palette is decoded before layers, so every layer can address a color by its
palette index.

The palette codec first prefix-encodes the number of colors, with three colors
as the shortest case, followed by each color.

### Palette size

| Colors | Bits                       |
| -----: | :------------------------- |
|      3 | `0`                        |
|      2 | `10`                       |
|      4 | `110`                      |
|      5 | `1110`                     |
|      1 | `11110`                    |
|      6 | `111110`                   |
|      7 | `1111110`                  |
|     8+ | `1111111 gamma(count - 7)` |

### Palette color

| Color         | Bits              |
| :------------ | :---------------- |
| Red           | `00`              |
| White         | `01`              |
| Blue          | `100`             |
| Yellow/gold   | `101`             |
| Green         | `110`             |
| Black         | `1110`            |
| Custom RGB343 | `11110` + 10 bits |
| Orange        | `11111`           |

The direct colors are protocol constants, not claims that every country uses the
same exact official shade. The current constants are:

| Name        | RGB         | Hex       |
| :---------- | :---------- | :-------- |
| Red         | 210,16,52   | `#D21034` |
| White       | 255,255,255 | `#FFFFFF` |
| Blue        | 0,56,168    | `#0038A8` |
| Yellow/gold | 252,209,22  | `#FCD116` |
| Green       | 0,155,58    | `#009B3A` |
| Black       | 0,0,0       | `#000000` |
| Orange      | 255,130,0   | `#FF8200` |

The reference encoder snaps to the closest preset when Euclidean distance in
8-bit sRGB is at most 48. This threshold is an encoder rule, not additional wire
data. Custom colors use a compact 10-bit RGB approximation:

```text
RRR GGGG BBB
 3    4    3 bits
```

Green receives the extra bit because visual sensitivity is greater there.
The representation is deliberately approximate rather than a claim to preserve
an official Pantone/CIELAB/CMYK specification exactly.

---

# 3. Layers

Layers form a tiny rendering program. They are painted in array order, with each
layer placed on top of the previous result.

The section starts with the number of layers, so it is self-delimiting without
an END token.

## Layer count

| Count | Bits                      |
| ----: | :------------------------ |
|     1 | `0`                       |
|     2 | `10`                      |
|     3 | `110`                     |
|     4 | `1110`                    |
|     5 | `11110`                   |
|     6 | `111110`                  |
|    7+ | `111111 gamma(count - 6)` |

## Layer type

| Layer     | Bits     |
| :-------- | :------- |
| Stripes   | `0`      |
| Shape     | `10`     |
| Region    | `110`    |
| Cross     | `1110`   |
| Band      | `11110`  |
| Builtin   | `111110` |
| Extension | `111111` |

The long extension leaf contains its own type ID and payload length, so unknown
future layer families can be preserved or skipped without losing framing.

---

## 3.1 Stripes layer

A single stripe family covers solid fields, equal stripes, weighted stripes,
and repeated alternating stripes.

```text
0 + STRIPE_MODE + payload
```

Except for `solid-0`, stripe modes then write one direction bit:

```text
0 = horizontal
1 = vertical
```

### Stripe modes

| Mode              | Bits        | Meaning                                |
| :---------------- | :---------- | :------------------------------------- |
| palette-equal     | `0`         | all palette colors once, equal widths  |
| solid-0           | `10`        | solid palette[0]                       |
| first-two-equal   | `110`       | palette[0], palette[1]                 |
| ABA equal         | `1110`      | 0,1,0 with equal widths                |
| ABA 1:2:1         | `11110`     | 0,1,0 weighted 1,2,1                   |
| ABCBA 1:1:2:1:1   | `111110`    | 0,1,2,1,0                              |
| alternating 01    | `1111110`   | 0,1,0,1... + repeat count              |
| ABA 2:1:2         | `11111110`  | 0,1,0 weighted 2,1,2                   |
| explicit equal    | `111111110` | count + palette refs                   |
| explicit weighted | `111111111` | count + `(palette ref, gamma(weight))` |

Weights are positive integers and are reduced by their common GCD before
encoding.

### Repeating stripe count

| Stripe count | Bits                |
| -----------: | :------------------ |
|           13 | `0`                 |
|           14 | `10`                |
|            9 | `110`               |
|           11 | `1110`              |
|        other | `1111 gamma(count)` |

This targets real national-flag patterns such as the United States (13),
Malaysia (14), Greece/Uruguay (9), and Liberia (11).

### Very short examples

Assuming palette order matches stripe order:

```text
Germany / equal horizontal tricolor
layer count   0
layer type    0
stripe mode   0
direction     0
              ----
              0000   = 4 layer bits
```

France changes only the final direction bit to `1`.

Spain maps directly to horizontal `ABA 1:2:1`. Latvia maps to `ABA 2:1:2`.
Thailand maps to `ABCBA 1:1:2:1:1`.

---

## 3.2 Shape layer

Shapes cover common charges and procedural groups.

### Shape type

| Shape    | Bits   |
| :------- | :----- |
| Star     | `0`    |
| Disc     | `10`   |
| Crescent | `110`  |
| Sun      | `1110` |
| Diamond  | `1111` |

A palette color follows. A one-bit flag then indicates whether the shape has a
border; when set, another palette reference supplies the border color.

### Star points

| Points | Bits                   |
| -----: | :--------------------- |
|      5 | `0`                    |
|      6 | `10`                   |
|      4 | `110`                  |
|      7 | `1110`                 |
|      8 | `11110`                |
|     12 | `111110`               |
| custom | `111111 gamma(points)` |

### Placement

| Placement | Bits    | Purpose                                    |
| :-------- | :------ | :----------------------------------------- |
| centered  | `0`     | one centered shape, default size/rotation  |
| custom    | `10`    | optional position/size/rotation modifiers  |
| ring      | `110`   | evenly spaced circular group               |
| US-50     | `1110`  | 50-star staggered field in previous region |
| grid      | `11110` | regular rows/columns                       |
| points    | `11111` | explicit small group of positioned shapes  |

`US-50` intentionally targets the current United States flag without encoding
50 stars individually. It requires the immediately preceding layer to be a
region, normally the blue canton. The renderer expands it to nine staggered rows
with alternating 6/5 star counts.

A ring count of 12 has the shortest count code, followed by 10, targeting common
12-star and Cabo-Verde-style ten-star rings. The default ring is centered in its
scope; the optional ring size is its radius normalized to the smaller scope
dimension.

The explicit-points mode supports irregular small constellations such as the
Southern Cross without inventing a country-specific top-level layer.

---

## 3.3 Region layer

Regions paint a bounded area with one palette color.

| Region              | Bits    |
| :------------------ | :------ |
| Hoist triangle      | `0`     |
| Canton              | `10`    |
| Diagonal half-plane | `110`   |
| Center rectangle    | `1110`  |
| Rectangle           | `11110` |
| Arbitrary triangle  | `11111` |

Hoist triangles and cantons have cheap default geometry plus a custom-geometry
bit. Generic rectangles/triangles use Unit5 coordinates. Default geometry is:

- hoist triangle: full hoist edge, apex at `(1/3, 1/2)`
- canton: top-left rectangle of `1/2 × 1/2`
- center rectangle: centered rectangle of `1/2 × 1/2`

Coordinates and sizes are normalized within the current flag/scope.

Examples include Bahamas/Comoros-style hoist triangles and the canton used by
the United States, Greece, Malaysia, Australia and New Zealand.

---

## 3.4 Cross layer

| Style                             | Bits   |
| :-------------------------------- | :----- |
| Nordic cross                      | `0`    |
| Centered cross                    | `10`   |
| Centered cross in previous region | `110`  |
| Saltire                           | `1110` |
| Saltire in previous region        | `1111` |

A palette color follows, plus an optional border/fimbriation color. Default
geometry is free. For custom geometry, width is Unit5; a Nordic cross additionally
encodes the horizontal position of its vertical bar as Unit5. The reference
renderer defaults to cross width `0.12` and Nordic offset `1/3`.

`previous-region` avoids repeating canton coordinates for flags such as Greece.
Nordic crosses are first-class because the same construction is reused across
several national flags.

---

## 3.5 Band layer

A band is a centered colored strip and is the generic fallback for diagonal,
horizontal or vertical overlays.

| Direction  | Bits  |
| :--------- | :---- |
| `/`        | `0`   |
| `\\`       | `10`  |
| horizontal | `110` |
| vertical   | `111` |

A color follows, then an optional border color and optional custom Unit5 width.
If width is omitted, the reference renderer uses `0.20` of the scoped height for
horizontal/diagonal bands and `0.20` of scoped width for vertical bands. This is
useful for diagonal designs such as Congo, Tanzania, Namibia, and Trinidad and
Tobago without introducing a global rotation operation.

---

## 3.6 Builtin layer

Some repeated complex motifs are dramatically cheaper as versioned built-ins.
The first built-in is the Union Jack.

| Builtin mode                 | Bits                         |
| :--------------------------- | :--------------------------- |
| Union Jack, full flag        | `0`                          |
| Union Jack, canton           | `10`                         |
| Union Jack, previous region  | `110`                        |
| Union Jack, custom rectangle | `1110`                       |
| generic builtin              | `1111 gamma(id) + placement` |

This keeps the UK extremely small and avoids reconstructing the same complex
motif for Australia, New Zealand, Fiji, Tuvalu, and related ensign designs.
Future complex coats of arms or emblems can receive stable built-in IDs without
changing the layer type tree.

---

## 3.7 Extension layer

The generic forward-compatible layer escape is:

```text
111111
  gamma(typeId)
  gamma(payloadBitLength + 1)
  raw payload bits
```

`+1` allows an empty payload even though Elias gamma only represents positive
integers. Because the payload length is explicit, old decoders can retain an
unknown extension and still find the next layer exactly.

---

# Rendering semantics

1. Create a transparent/empty canvas with the decoded aspect ratio.
2. Resolve palette colors.
3. Paint `layers[0]`, then `layers[1]`, and so on.
4. A `previous-region` scope always refers to the **immediately preceding**
   Region layer. Arbitrary back-references are intentionally not supported.
5. Layer-local geometry is clipped to its scope.
6. There is no global Rotation layer. Diagonal regions/bands and shape-local
   rotation cover the useful cases without changing the coordinate system for
   subsequent layers.

# Canonical encoding rules

- Rational aspect ratios are GCD-reduced.
- Stripe weights are GCD-reduced.
- The encoder selects a direct stripe template whenever one matches instead of
  using an explicit stripe mode.
- Default geometry should be omitted rather than encoded explicitly.
- Palette order should be chosen to minimize later palette-reference cost when
  this does not conflict with a shorter procedural template.
- Only zero bits may appear as final byte padding.
