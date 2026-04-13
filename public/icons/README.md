# Icon Files

The SVG icon has been created (`icon.svg`).

To generate PNG files, you can:

1. Use an online tool like https://cloudconvert.com/svg-to-png
2. Install ImageMagick and run:
   ```bash
   convert icon.svg -resize 16x16 icon16.png
   convert icon.svg -resize 48x48 icon48.png
   convert icon.svg -resize 128x128 icon128.png
   ```

For development, Chrome also supports SVG icons directly, so you can update manifest.ts to use:
```typescript
icons: {
  '16': 'icons/icon.svg',
  '48': 'icons/icon.svg',
  '128': 'icons/icon.svg',
}
```
