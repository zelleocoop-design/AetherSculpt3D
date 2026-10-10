# 🌌 AetherSculpt 3D — Spatial Drawing & Sculpting Studio

[![Three.js](https://img.shields.io/badge/Three.js-r160-black?style=flat&logo=three.js)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web-brightgreen.svg)]()

> **AetherSculpt 3D** is a web-based 3D spatial drawing, sculpting, and creative suite designed for artists, designers, and creators. Draw expressive volumetric strokes, sculpt in true 3D space with camera-relative planes and symmetry, and export your creations directly to industry-standard 3D formats.

---

## ✨ Features

- 🎨 **Volumetric 3D Brushes**:
  - ⚡ **Neon Tube** — Full volumetric cylindrical extrusions.
  - 🎀 **Calligraphy Ribbon** — Camera-oriented silky quads.
  - ✨ **Stardust Trail** — Luminous particle streams with additive blending.
  - 🕸️ **Wireframe Mesh** — Architectural structural lattice.
  - 💎 **Crystal Facets** — Geometric crystalline structures.
  - 🧊 **Voxel Block** — Spatial 3D cubic strokes.
  - 🔥 **Plasma Arc** — High-energy jagged wave beams.

- 🔮 **Advanced PBR & Shaders**:
  - Shaders for **Glow / Emissive**, **Liquid Chrome**, **Crystal Glass**, **Gloss Lacquer**, **Iridescent Pearl**, **Matte Clay**, **Spectrum Rainbow**, and **Wireframe**.
  - Dynamic brightness, bloom intensity, and custom RGB palette tints.

- 📐 **Spatial Planes & Drawing Modes**:
  - **In-Front Distance Lock**: Automatically positions the drawing canvas directly in front of the camera viewport.
  - **Fixed Planes**: Front Wall (`XY`), Floor (`XZ`), and Side Wall (`YZ`).
  - **Symmetry Engine**: Mirror across `X`, `Y`, `Z` axes and `4x`/`8x` Radial symmetries.

- 🎥 **Fluid Spatial Controls**:
  - **6-DOF Movement**: `WASD` navigation + `Q`/`E` vertical flight.
  - **Free FPS Camera Rotation**: Smooth mouse look and touch rotation.
  - **Interactive Turntable**: 360° auto-showcase mode.

- 💾 **Universal Export**:
  - 📦 **glTF / GLB**: Ready for Blender, Unity, Unreal Engine, and WebXR.
  - 🗿 **Wavefront OBJ**: Universal mesh export.
  - 📸 **4K HD Screenshot**: Capture high-resolution portfolio renders.

- 🎵 **Audio & Haptic Feedback**:
  - Integrated synthesized spatial audio feedback for strokes, tools, and UI interactions.

---

## 🚀 Quick Start

No build tools or bundlers required. AetherSculpt runs natively in any modern web browser.

### Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zelleocoop-design/AetherSculpt.git
   cd AetherSculpt
   ```

2. **Serve with any static HTTP server**:
   ```bash
   # Using Python
   python -m http.server 8080

   # Or using Node / npx
   npx serve .
   ```

3. Open your browser at `http://localhost:8080`.

---

## 🕹️ Controls & Shortcuts

| Action | Input |
|---|---|
| **Draw Stroke in 3D** | `Left Click` / `Touch Drag` |
| **Camera Fly Navigation** | `W`, `A`, `S`, `D` |
| **Fly Up / Down** | `E` / `Q` |
| **Look / Rotate Viewport** | `Right Click + Drag` |
| **Pan Canvas** | `Middle Click + Drag` |
| **Speed Boost** | Hold `Shift` or `Ctrl` |
| **Undo / Redo** | `Ctrl + Z` / `Ctrl + Y` |
| **Switch Brush Presets** | Keys `1` – `7` |
| **Adjust Stroke Size** | `[` / `]` |
| **Zen / Immersive Mode** | `Tab` |

---

## 🛠️ Tech Stack

- **Graphics Core**: [Three.js](https://threejs.org/) (WebGL2, Postprocessing Bloom, ACES Filmic Tone Mapping)
- **Architecture**: Modular ES6 Modules (`materials.js`, `brushEngine.js`, `drawController.js`, `symmetry.js`, `exporter.js`)
- **Typography & Theme**: Plus Jakarta Sans, JetBrains Mono, Glassmorphism UI
- **Zero Dependencies**: Pure Vanilla JS & CSS without bloated frameworks
