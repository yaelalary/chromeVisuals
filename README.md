# Chrome Visuals

A small web tool for making Y2K-style chrome artwork for music covers.

**Live:** https://yaelalary.github.io/chromeVisuals/

## Features

- **Looks**: Chrome, Holo, Ice and Nocturne, each with its own reflections, colours and typography
- **Shapes**: generated ribbons, zigzags, knots, shards and liquid metal, or freehand drawing turned into 3D chrome tubes
- **Image import**: turn a logo or photo into an inflated chrome object or a metal relief
- **Materials**: brushed, hammered, rippled, sandblasted and more, plus metal tint
- **Backgrounds**: gradient, glow, retro grid, stars, halftone, rays, clouds
- **Effects**: bloom, sparkles, chromatic aberration, vignette, grain, scanlines
- **Symmetry**: mirror, quadrants and kaleidoscope
- **Surprise** button to roll a random combination
- Title and artist text, exported as a square PNG (1500 or 3000 px)

## Getting started

Requires Node 22.

```sh
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run build    # production build in dist/
```

## Stack

Vue 3, TypeScript, Vite, Three.js and Vitest. Pushes to `master` are deployed to GitHub Pages by the workflow in `.github/workflows/deploy.yml`.
