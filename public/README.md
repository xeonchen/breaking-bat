# Public Assets

This directory contains static assets that will be served directly by the web server.

## Icons Required

The following icons need to be created for the PWA to work properly:

- `favicon.ico` - Standard browser favicon (16x16, 32x32, 64x64 pixels)
- `apple-touch-icon.png` - Apple touch icon (180x180 pixels)
- `icon-192x192.png` - PWA icon (192x192 pixels)
- `icon-512x512.png` - PWA icon (512x512 pixels)
- `masked-icon.svg` - Safari pinned tab icon
- `screenshot-wide.png` - PWA screenshot for wide displays (1280x720)
- `screenshot-narrow.png` - PWA screenshot for narrow displays (750x1334)

## Current Status

- ✅ `vite.svg` - Default Vite logo
- ✅ `icon.svg` - Custom softball/baseball icon
- ❌ PNG and ICO files need to be created

## Note

The `icon.svg` file contains a custom softball-themed icon that matches the app's purpose. You can convert this SVG to the required PNG and ICO formats using tools like:

- https://favicon.io/favicon-converter/
- https://realfavicongenerator.net/
- ImageMagick command line tools

For screenshots, you'll need to create them after the app is deployed.
