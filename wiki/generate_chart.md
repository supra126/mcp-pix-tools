# generate_chart

Generates simple charts from data. Supports bar charts, pie charts, and line charts.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | `"bar"` \| `"pie"` \| `"line"` | Yes | — | Chart type |
| `data` | array (1-50) | Yes | — | Data point array |
| `data[].label` | string | Yes | — | Data label |
| `data[].value` | number | Yes | — | Data value |
| `title` | string | No | `"Chart"` | Chart title |
| `width` | number (200-2000) | No | `600` | Chart width (px) |
| `height` | number (200-2000) | No | `400` | Chart height (px) |
| `format` | `"png"` \| `"svg"` | No | `"png"` | Output format |
| `colors` | string[] | No | Built-in 10 colors | Custom color array (hex with #) |

## Chart Types

### Bar Chart (bar)

- Vertical bars, one per data point
- Automatic Y-axis scale and gridlines
- Values displayed above each bar
- Labels on the X-axis

### Pie Chart (pie)

- Each data point is a sector
- Labels show name and percentage
- Proportions are calculated automatically

### Line Chart (line)

- Data points connected by lines
- Includes a semi-transparent fill area
- Each data point has a dot marker and value label

## Examples

### Bar Chart

```json
{
  "type": "bar",
  "title": "Monthly Revenue",
  "data": [
    { "label": "Jan", "value": 120 },
    { "label": "Feb", "value": 150 },
    { "label": "Mar", "value": 180 },
    { "label": "Apr", "value": 90 },
    { "label": "May", "value": 200 }
  ]
}
```

### Pie Chart

```json
{
  "type": "pie",
  "title": "Browser Market Share",
  "data": [
    { "label": "Chrome", "value": 65 },
    { "label": "Firefox", "value": 15 },
    { "label": "Safari", "value": 12 },
    { "label": "Edge", "value": 5 },
    { "label": "Other", "value": 3 }
  ],
  "width": 500,
  "height": 500
}
```

### Line Chart (Custom Color)

```json
{
  "type": "line",
  "title": "Daily Active Users",
  "data": [
    { "label": "Mon", "value": 1200 },
    { "label": "Tue", "value": 1350 },
    { "label": "Wed", "value": 1100 },
    { "label": "Thu", "value": 1500 },
    { "label": "Fri", "value": 1800 }
  ],
  "colors": ["#e74c3c"],
  "format": "svg"
}
```

## Built-in Colors

When `colors` is not specified, the following 10 colors are used in rotation:

1. `#3498db` Blue
2. `#e74c3c` Red
3. `#2ecc71` Green
4. `#f39c12` Orange
5. `#9b59b6` Purple
6. `#1abc9c` Teal
7. `#e67e22` Dark Orange
8. `#34495e` Dark Blue-Gray
9. `#16a085` Dark Teal
10. `#c0392b` Dark Red

## Notes

- Charts are rendered as pure SVG with no external charting library dependencies
- Suitable for simple data visualization; not intended for complex statistical charts
- Pie chart labels may overlap when there are too many items — it is recommended to keep it within 8 items
