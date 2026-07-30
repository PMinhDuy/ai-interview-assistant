# Design Specification — AI Interview Assistant

```yaml
version: "1.0"
theme:
  mode: "light"
  brand:
    primary: "#1677ff"
    primaryHover: "#4096ff"
    primaryActive: "#0958d9"
  colors:
    background: "#f5f7fa"
    surface: "#ffffff"
    textPrimary: "#1f2937"
    textSecondary: "#6b7280"
    border: "#e5e7eb"
    success: "#52c41a"
    warning: "#faad14"
    error: "#ff4d4f"
  typography:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    fontSizeBase: 14
  spacing:
    unit: 8
  rounded:
    card: 12
    button: 6
    input: 8
```

## Visual Rationale

- **Clean Enterprise Style**: Enterprise-ready SaaS interface leveraging Ant Design 5 components (`@ant-design/nextjs-registry`).
- **Color Palette**: Deep tech blue (`#1677ff`) paired with clean light gray surface backgrounds (`#f5f7fa`).
- **Typography & Layout**: Modern sans-serif, high contrast readability for interview questions, evaluations, and analytical reports.
- **Anti-Slop**: Direct component hierarchy, clear status indicators (Success green, Error red, Processing blue), no unnecessary animations.
