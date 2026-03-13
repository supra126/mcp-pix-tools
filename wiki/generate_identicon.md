# generate_identicon

Generates a unique geometric avatar (identicon) based on an input string.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `value` | string | Yes | — | Input string (hashed to produce the pattern) |
| `size` | number (16-1024) | No | `256` | Image size in pixels (square) |
| `format` | `"png"` \| `"svg"` | No | `"png"` | Output format |
| `background` | string | No | — | Background color (hex, e.g. `ffffff` or `ffffff00` with alpha) |
| `saturation` | number (0-1) | No | — | Color saturation |

## Features

- **Deterministic**: The same input always produces the same pattern
- **Unique**: Different inputs produce different patterns
- **Symmetric**: Generated patterns are symmetric geometric shapes

## Examples

### Basic Avatar

```json
{
  "value": "user@example.com",
  "size": 256,
  "format": "png"
}
```

### Transparent Background

```json
{
  "value": "john_doe",
  "size": 128,
  "background": "ffffff00"
}
```

### Low Saturation

```json
{
  "value": "project-alpha",
  "saturation": 0.3,
  "format": "svg"
}
```

### Large Avatar with White Background

```json
{
  "value": "company-id-12345",
  "size": 512,
  "background": "ffffff"
}
```

## Output Examples

<table>
<tr>
<td align="center"><code>"supra126"</code></td>
<td align="center"><code>"user@example.com"</code></td>
</tr>
<tr>
<td><img src="images/identicon_1.svg" width="128"></td>
<td><img src="images/identicon_2.svg" width="128"></td>
</tr>
</table>

*Same input always produces the same unique pattern*

## Use Cases

- Default user avatars (generated from email or username)
- Project/organization identity icons
- Node icons in data visualizations
- GitHub-style anonymous avatars
