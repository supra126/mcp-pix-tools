# generate_palette

Generates a color palette/swatch card from a base color using color theory.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `baseColor` | string | Yes | — | Base color (hex, e.g. `#3498db` or `3498db`) |
| `scheme` | string (enum) | No | `"analogous"` | Color scheme |
| `count` | number (2-12) | No | `5` | Number of colors to generate |
| `format` | `"png"` \| `"svg"` | No | `"png"` | Output format |
| `swatchSize` | number (40-200) | No | `100` | Swatch block size (px) |

## Color Schemes

| scheme | Description | Hue Relationship |
|--------|-------------|------------------|
| `complementary` | Complementary | Opposite on the color wheel (+180 degrees) |
| `analogous` | Analogous | Adjacent on the color wheel (+/-30 degrees) |
| `triadic` | Triadic | Three equal divisions (+120 degrees) |
| `tetradic` | Tetradic | Four equal divisions (+90 degrees) |
| `monochromatic` | Monochromatic | Same hue, varying lightness |
| `split-complementary` | Split-complementary | Flanking the complement (+150 degrees, +210 degrees) |

## Examples

### Triadic Palette

```json
{
  "baseColor": "#3498db",
  "scheme": "triadic",
  "count": 6,
  "format": "png"
}
```

### Monochromatic Gradient

```json
{
  "baseColor": "e74c3c",
  "scheme": "monochromatic",
  "count": 8,
  "swatchSize": 80
}
```

### Complementary SVG

```json
{
  "baseColor": "#2ecc71",
  "scheme": "complementary",
  "format": "svg"
}
```

## Response Format

The response contains two content items:

1. **Text**: Color scheme name + list of all hex codes
```
Palette: triadic from #3498DB
1. #3498DB
2. #DB3434
3. #34DB34
```

2. **Swatch image** (PNG or SVG): Each color displayed as a rounded square with its hex code labeled below
