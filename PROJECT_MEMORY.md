# Grand Heritage Catering & Events - Project Memory

## Project Overview
- **Brand**: Grand Heritage Catering & Events
- **Permanent Local Location**: `D:\My-Work\Ai-Websites\Catering`
- **GitHub Repositories**:
  - `https://github.com/Penta-Websites/Catering`
  - `https://github.com/Pixel-Force/Catering`
- **Live Deployments (GitHub Pages)**:
  - [https://penta-websites.github.io/Catering/](https://penta-websites.github.io/Catering/)
  - [https://pixel-force.github.io/Catering/](https://pixel-force.github.io/Catering/)

## Concept & Architecture
- **Industry**: Food & Beverage / Luxury Catering & Events
- **Color Palette**:
  - Primary: Deep Burgundy (`#702D3A`)
  - Secondary: Warm Cream (`#FFF8EF`)
  - Accent: Golden Beige (`#C69A5B`)
  - Text: Dark Charcoal (`#292929`)
  - Surface: Crisp White (`#FFFFFF`)
- **Typography**: *Playfair Display* (Editorial luxury serif) & *Plus Jakarta Sans* (Modern sans-serif)
- **Full-Stack Architecture**:
  - Node.js & Express REST API (`server/api.js`, `server/server.js`)
  - SQLite database in WAL mode (`data/catering.db`) with bcrypt auth (12 rounds) and JWT tokens
  - 15+ HTML pages with relative navigation for static GitHub Pages and dynamic Express hosting
  - Intelligent Offline Fallback Engine (`js/data-fallback.js`) enabling 100% interactive execution on static GitHub Pages

## Verification & Status
- **Test Suite**: Automated integration suite (`test-suite.js`) passing 8/8 tests (Categories, Menu items, Packages, Portal inquiry lookup, Admin authentication, Inquiry wizard submission, Client quote acceptance, and Dashboard stats).
- **Mockup**: High-resolution vector mockup graphic created at `assets/mockup.svg` and embedded into `README.md`.
- **Status**: Production-ready, fully deployed, and verified.
