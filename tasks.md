# WarperGrid TODO Specification

Based on community feedback from Reddit (r/reactjs) and user testing.

---

## 🔴 Critical (Must-Fix Before Production)

### 1. 📱 Mobile UX & Scrolling

- [x] **Smooth native scrolling** — Fix cell-snapping behavior, enable smooth inertia scrolling on iOS/WebKit (Safari) and tablets ✅ DONE
- [x] **Horizontal scrolling fluidity** — Improve continuous horizontal swipe/drag on mobile browsers ✅ DONE
- [ ] **Touch testing matrix** — Establish device/browser matrix (iOS Safari, Chrome, Firefox; Android Chrome/Firefox) and document friction points

### 2. 🐛 Demo Bug Fixes

- [x] **Cell editing UI** — Fix inconsistent triggers (double-click vs Enter), ensure predictable behavior across platforms ✅ DONE
- [ ] **Sorting controls** — Fix non-functional sort buttons in demo
- [ ] **Filter UI** — Make filter controls actually filter rows
- [x] **Range selection** — Correct unintended expansion after drag release ✅ DONE
- [x] **Large dataset crashes** — Prevent crashes/extreme lag when selecting 5M–10M rows on phones ✅ DONE (improved warnings and safeguards)

### 3. 🛠 Cross-Browser Compatibility

- [ ] **WebAssembly fallbacks** — Provide JS fallback for browsers with WASM/WebKit issues
- [ ] **Browser compatibility tests** — Maintain test suite for Chrome, Firefox, Safari, Edge

---

## 🟡 High Priority (Pre-Launch)

### 4. 📊 Benchmark Transparency

- [ ] **Live benchmark comparison** — Show side-by-side WarperGrid vs AG Grid for same dataset sizes
- [ ] **Performance indicators** — Display scroll FPS, load times, memory usage in demo

### 5. 📌 UI Improvements

- [x] **Scrollbar visibility** — Ensure scrollbars are clearly visible in demo grid ✅ DONE
- [ ] **Mobile UI polish** — Fix overlapping menus, transparent backgrounds on mobile nav/header

### 6. 📄 Documentation & Onboarding

- [ ] **Core API documentation** — Document sorting, filtering, custom cell renderers
- [ ] **Demo embedding** — Show live demo directly on landing page or prominently linked
- [ ] **Plugin usage guides** — Explain how to attach/reuse modular features (e.g., `attach(['*'])`)

---

## 🟢 Medium Priority (Post-Launch)

### 7. 📱 Responsive Strategy

- [x] **Responsive grid layout** — Provide alternate layouts (stacked data, column hide/overflow) on narrow screens ✅ DONE (improved mobile CSS)
- [ ] **Feature flags by device** — Disable heavy interactive features on small screens for performance

### 8. 🧑‍💻 Developer Experience (DX)

- [ ] **Clear examples** — Add examples for common workflows: editing, selection, formulas, exporting
- [ ] **Plugin documentation** — Comprehensive docs for plugin system

### 9. 🧪 Stability & Edge Cases

- [x] **Large dataset behavior** — Improve responsiveness for millions of rows on resource-limited devices ✅ DONE
- [x] **Fallback UX** — Add warnings, progressive load indicators, or caps for huge datasets ✅ DONE

---

## 🔵 Nice-to-Have (Future Roadmap)

### 10. 🚀 Advanced Features

- [ ] **Feature parity** — Add missing features vs competitors (charting, advanced grouping strategies)
- [ ] **Plugin ecosystem** — Build first-party plugins and community templates

### 11. 📦 Source Availability

- [x] **License clarification** — Proprietary license with clear terms (DONE - See LICENSE file)
- [x] **Repository public** — GitHub repo now public at github.com/warper-org/warper-grid (DONE)

---

## ✅ Completed

- [x] Rewrite all plugins with top-notch performance
- [x] Ensure plugin compatibility with latest version
- [x] Setup project for private distribution
- [x] Optimize plugin performance
- [x] Create LICENSE file (Proprietary, Courts of India jurisdiction)
- [x] Add GitHub repository links to package.json and homepage
- [x] Update Terms of Service and License Agreement with India jurisdiction
- [x] Enable smooth native scrolling on mobile (iOS/WebKit)
- [x] Fix horizontal scrolling fluidity
- [x] Make scrollbars visible (not hidden)
- [x] Fix range selection ending on mouse/touch up
- [x] Add touch event support for cell selection
- [x] Improve large dataset warning messages
- [x] Add mobile-friendly touch targets (min 44px height)
- [x] Add iOS/Safari specific CSS fixes (webkit-overflow-scrolling, touch-action, zoom prevention)
- [x] Make SQL Query Panel responsive for mobile (full-screen modal, stacked layouts)
- [x] Update embedded SQL panel for mobile viewports
- [x] Add mobile toolbar responsiveness (icon-only buttons, horizontal scroll)
- [x] Add safe area insets for notched devices (iPhone X, etc.)
- [x] Add touch-device specific styling (hover:none, pointer:coarse)