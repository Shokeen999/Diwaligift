# 🪔 The Royal Diwali Box — 4K Scroll Experience

A cinema-grade, award-winning scroll-driven animation website showcasing the unboxing of a royal Diwali gift box in full 4K UHD.

![Diwali 4K Scroll](https://img.shields.io/badge/Resolution-3840x2160%204K%20UHD-gold?style=for-the-badge)
![Frames](https://img.shields.io/badge/Frames-239%20Frames-crimson?style=for-the-badge)
![FPS](https://img.shields.io/badge/FPS-60%2F120%20FPS%20Canvas-orange?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20Node.js-blue?style=for-the-badge)

---

## ✨ Features

- **4K UHD Hardware-Accelerated Canvas Engine**: Renders all 239 individual 3840×2160 UHD frames smoothly with high-DPI retina scaling.
- **Silky Lerp Interpolation**: Frame progression smoothly interpolates towards scroll position for seamless, fluid motion.
- **Multi-Tier Progressive Preloader**: Frame 0 displays immediately, milestone keyframes load next, and background streaming caches the rest with nearest-frame fallback (zero blank screens).
- **Apple-Grade Floating Chapters**: 5 narrative phases gracefully fade in and out as you scroll through the unboxing:
  1. *Chapter I: The Royal Unveiling*
  2. *Chapter II: Gilded Craftsmanship*
  3. *Chapter III: Radiance Unleashed*
  4. *Chapter IV: Sacred Treasures*
  5. *Chapter V: Shubh Deepavali Blessings*
- **Canvas Drag-to-Scrub & Sparks**: Click and drag across the screen to scrub through the animation, or click to launch festive golden sparkler bursts.
- **Procedural Ambient Soundscape**: Authentic Indian classical Tanpura drone and meditative temple chimes synthesized client-side via the Web Audio API.
- **Personalized Greeting Generator**: Customize recipient and sender names and share personalized Diwali blessings.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)

### Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/Shokeen999/Diwaligift.git
   cd Diwaligift
   ```

2. Start the local server:
   ```bash
   node server.js
   ```

3. Open your browser and visit:
   ```
   http://localhost:3000
   ```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Auto-Play / Pause cinematic animation |
| <kbd>←</kbd> / <kbd>→</kbd> | Step backward / forward 1 frame |
| <kbd>Shift</kbd> + <kbd>→</kbd> | Jump 10 frames forward |
| <kbd>M</kbd> | Toggle Ambient Sound |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>Home</kbd> / <kbd>End</kbd> | Jump to start / end of animation |

---

## 📄 License

MIT © [Shokeen999](https://github.com/Shokeen999)

