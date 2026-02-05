# 📱 Beach Alley - UI Test (Mobile First)

**Smartphone-First UI Prototype with Tabbed Layout**

## 🎯 Overview

This test component demonstrates Beach Alley's mobile-first user interface with:
- Complete navigation flow (Splash → Menu → Game)
- Tabbed bottom navigation layout
- Horizontal scrolling for content
- Animated drawers for deep information
- Viewport-locked design (no page scrolling)
- Touch-optimized interactions

## 🚀 Features

### Navigation Flow
1. **Splash Screen** 
   - Auto-proceeds after 2.5s or tap to skip
   - Animated loading bar
   - Synthwave branding

2. **Main Menu**
   - Animated wave background
   - Primary/secondary button hierarchy
   - Settings, about, continue game options

3. **Game Screen - Tabbed Layout**
   - Three main tabs (Game, Build, Manage)
   - Horizontal scrolling content areas
   - Animated drawer panels
   - Touch-optimized controls

## 📐 Tabbed Layout (Primary Focus)

### Tab Structure

#### 🎮 Game Tab
- **Main Area**: Game canvas (full viewport)
- **Bottom Actions**: Horizontal scrolling action buttons
  - Pause, Speed controls (x2, x4)
  - Save Game, Screenshot
  - Sound, Layout switcher
- **Swipe**: Navigate between actions

#### 🏗️ Build Tab
- **Buildings Section**: Horizontal scrolling cards
  - Beach Bar, Sun Lounger, Restaurant, Shop, etc.
  - Icon + Name + Cost
  - 8 building types
- **Decorations Section**: Horizontal scrolling cards
  - Palm Tree, Beach Sign, Lighthouse, etc.
  - 5 decoration types
- **Swipe**: Browse available buildings

#### 📊 Manage Tab
- **4 Main Buttons** (opens drawer on click):
  - 📊 **Statistics** - Analytics with trend indicators
  - 💰 **Finance** - Cash, income, expenses, loans
  - 👥 **Staff** - Employee cards, hiring
  - ⚙️ **Settings** - Toggles, tutorial, credits

### Animated Drawers
- **Trigger**: Click manage buttons
- **Animation**: Slide up with bounce (cubic-bezier)
- **Height**: 70% of viewport
- **Overlay**: Darkened background with fade-in
- **Close**: Tap outside or X button
- **Content**: Rich, scrollable information panels

## 🎨 Animations

### 1. Tab Indicator Gradient
```css
background: linear-gradient(90deg, #FF0080, #00ffff)
animation: gradientShift 3s ease infinite
```
**Pink to blue** animated gradient on active tab

### 2. Drawer Slide-Up
```css
animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)
```
Elastic bounce effect on drawer open

### 3. Building Icons Pulse
```css
animation: pulse 2s ease-in-out infinite
```
Gentle breathing animation

### 4. Overlay Fade
```css
animation: fadeIn 0.3s ease-out
```
Smooth background darken

### 5. All Interactions
- 0.3s smooth transitions
- Transform and color changes
- Touch-responsive feedback

## 🧩 Component Architecture

### Screens (`src/screens/`)
- `SplashScreen.tsx` - Animated opening screen
- `MainMenu.tsx` - Main navigation hub  
- `GameScreen.tsx` - Tabbed layout container

### Layouts (`src/layouts/`)
- `LayoutTabbed.tsx` - **PRIMARY LAYOUT** with tabs, scrolling, drawers
- ~~`LayoutCompact.tsx`~~ - Alternative (available but not primary)
- ~~`LayoutExpanded.tsx`~~ - Alternative (available but not primary)
- ~~`LayoutMinimal.tsx`~~ - Alternative (available but not primary)

### Components (`src/components/`)
- `TopBar.tsx` - Consistent top navigation
- `GameCanvasPlaceholder.tsx` - Game view placeholder
- `InfoPanel.tsx` - Reusable info card
- `ActionButton.tsx` - Styled action buttons

## 📱 Mobile-First Design Principles

### 1. Viewport Constraints
```css
html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: fixed;
  touch-action: none;
}
```

### 2. Touch Targets
- Minimum 44x44px touch targets
- Adequate spacing between interactive elements
- Large, clear tap areas

### 3. Responsive Sizing
- Relative units (%, vh, vw)
- Flexible layouts with CSS Grid/Flexbox
- No fixed pixel widths except minimum touch sizes

### 4. Performance
- Hardware-accelerated animations
- Minimal DOM manipulation
- Efficient re-renders

## 🎨 Design System

### Color Palette
- **Background**: Gradient (#1a1a2e → #16213e → #0f3460)
- **Primary Accent**: Cyan (#00ffff)
- **Secondary Accent**: Pink/Magenta (#FF0080)
- **Action**: Orange to Pink gradient (#FF6B35 → #FF0080)
- **Success**: Gold (#FFD93D)

### Typography
- System fonts for performance
- Font sizes: 0.65rem - 2.5rem
- Bold weights for emphasis

### Spacing Scale
- 4px, 8px, 10px, 12px, 15px, 20px, 25px, 40px

### Border Radius
- Small: 8px-10px
- Medium: 12px
- Large: 15px-20px
- Circular: 50%

## 🔧 Technical Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Inline styles with CSS animations
- **No Dependencies**: Pure React implementation
- **Port**: 5174

## 📦 File Structure

```
test_ui/
├── public/
├── src/
│   ├── components/
│   │   ├── ActionButton.tsx
│   │   ├── GameCanvasPlaceholder.tsx
│   │   ├── InfoPanel.tsx
│   │   └── TopBar.tsx
│   ├── layouts/
│   │   ├── LayoutTabbed.tsx        ⭐ PRIMARY
│   │   ├── LayoutCompact.tsx
│   │   ├── LayoutExpanded.tsx
│   │   └── LayoutMinimal.tsx
│   ├── screens/
│   │   ├── GameScreen.tsx
│   │   ├── MainMenu.tsx
│   │   └── SplashScreen.tsx
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── TABBED_LAYOUT.md          ⭐ DETAILED DOCS
```

## 🚦 Getting Started

```bash
# Navigate to test_ui
cd BeachAlley/sandbox/test_ui

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Access at: `http://localhost:5174`

**Test on mobile**: Open Chrome DevTools → Toggle device toolbar → Select mobile device

## 🎯 Design Goals Achieved

✅ **Smartphone-First**: Designed for mobile, scales up  
✅ **No Scrolling**: Viewport-locked, no page scroll  
✅ **Tabbed Navigation**: Bottom tabs with horizontal content scroll  
✅ **Animated Drawers**: Smooth slide-up panels for deep info  
✅ **Gradient Animations**: Pink-to-blue animated tab indicator  
✅ **Modular**: Easy to add/remove game components  
✅ **Navigation**: Complete flow from splash to game  
✅ **No Game Logic**: Pure UI demonstration  
✅ **Touch-Optimized**: Large targets, swipe gestures  
✅ **Performance**: Hardware-accelerated, smooth 60fps

## 🎨 Animation Showcase

| Element | Animation | Duration | Effect |
|---------|-----------|----------|--------|
| Tab Indicator | Gradient Shift | 3s loop | Pink ↔ Blue gradient |
| Drawer Open | Slide Up + Bounce | 0.4s | Elastic ease |
| Building Icons | Pulse | 2s loop | Breathing scale |
| Overlay | Fade In | 0.3s | Smooth darken |
| All Buttons | Transitions | 0.3s | Hover/touch feedback |

## 💡 Usage Notes

### Horizontal Scroll Areas
- **Game Tab**: 7 action buttons (swipe for more)
- **Build Tab**: 8 buildings + 5 decorations (swipe for more)
- Scrollbars hidden but functionality preserved
- Native momentum scrolling on mobile

### Drawer System
- Only in **Manage Tab**
- 4 drawer types: Statistics, Finance, Staff, Settings
- 70% viewport height
- Animated slide-up with bounce
- Tap outside or X to close
- Internal scrolling for long content

## 🔮 Future Enhancements

- [ ] Swipe gestures between tabs
- [ ] Pull-to-dismiss drawers
- [ ] Landscape mode optimization
- [ ] Tablet-specific layouts
- [ ] Desktop responsive breakpoints
- [ ] Haptic feedback integration
- [ ] Spring physics animations
- [ ] Dark/light theme toggle
- [ ] Accessibility features (ARIA, screen readers)
- [ ] Gesture tutorials for first-time users

## 📝 Notes

- **Primary Layout**: Tabbed (see `TABBED_LAYOUT.md` for details)
- All layouts are **viewport-constrained** - no page scrolling
- Components are **modular** - easy to add new game elements
- Navigation is **complete** - splash, menu, game flow
- **No game logic** - this is purely UI demonstration
- **Touch-first** - all interactions optimized for mobile
- **Animations** - Smooth, performant, delightful

---

**Version**: 0.1.0 Alpha  
**Created**: February 2026  
**Purpose**: Mobile-first UI with focused tabbed navigation  
**Primary Layout**: Tabbed with horizontal scroll and animated drawers
