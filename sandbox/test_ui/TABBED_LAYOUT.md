# 📑 Tabbed Layout - Focused Implementation

## Overview
The Tabbed Layout is the primary UI design for Beach Alley, featuring bottom tab navigation with horizontal scrolling content and animated drawers.

## 🎯 Key Features

### 1. Three Main Tabs
- **🎮 Game Tab** - Main gameplay view
- **🏗️ Build Tab** - Building and decoration selection
- **📊 Manage Tab** - Statistics, finance, staff, settings

### 2. Horizontal Scrolling
- **Game Tab**: Action buttons (Pause, Speed controls, Save, etc.)
- **Build Tab**: 
  - Buildings section (horizontally scrollable)
  - Decorations section (horizontally scrollable)
  - Each card is touch-friendly (110px min width)

### 3. Animated Drawers
- **Manage Tab Only**: Each option opens a drawer from bottom
- Drawers include:
  - 📊 **Statistics** - Revenue, visitors, satisfaction metrics
  - 💰 **Finance** - Cash, income, expenses, loans
  - 👥 **Staff** - Employee management, hiring
  - ⚙️ **Settings** - Game options, toggles, help

### 4. Animations

#### Tab Indicator
```css
background: linear-gradient(90deg, #FF0080, #00ffff)
animation: gradientShift 3s ease infinite
```
- Pink to blue animated gradient
- Smooth color flow on active tab

#### Drawer Opening
```css
animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)
```
- Slides up from bottom with bounce effect
- 70% screen height
- Rounded top corners (25px)

#### Building Icons
```css
animation: pulse 2s ease-in-out infinite
```
- Subtle breathing effect on building icons

#### Overlay Fade
```css
animation: fadeIn 0.3s ease-out
```
- Smooth background darkening

## 📐 Layout Structure

```
┌─────────────────────────────────┐
│         Top Bar                 │
│    ◀️  💰 1,234  👥 456  ⚙️     │
├─────────────────────────────────┤
│                                 │
│         Tab Content             │
│    (Game/Build/Manage views)   │
│                                 │
│   [Horizontal scroll areas]     │
│                                 │
├─────────────────────────────────┤
│    Bottom Tab Navigation        │
│    🎮 Game | 🏗️ Build | 📊 Manage │
│    [animated gradient line]     │
└─────────────────────────────────┘

When Drawer Opens:
┌─────────────────────────────────┐
│  Darkened overlay (70%)         │
│                                 │
│  ┌───────────────────────────┐ │
│  │  📊 Statistics         ✕  │ │
│  ├───────────────────────────┤ │
│  │                           │ │
│  │   Drawer Content          │ │
│  │   (scrollable)            │ │
│  │                           │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

## 🎨 Design Details

### Colors
- **Primary Gradient**: Pink (#FF0080) → Cyan (#00ffff)
- **Building Cards**: Semi-transparent with pink-cyan gradient overlay
- **Drawer Background**: Gradient (#1a1a2e → #16213e)
- **Highlights**: Cyan for active states

### Touch Targets
- Minimum 44x44px for all interactive elements
- Action cards: 85px width
- Building cards: 110px width
- Tab buttons: Full width / 3

### Spacing
- Section gaps: 15px
- Card gaps: 12px
- Padding: 15px-20px

## 🧩 Component Breakdown

### Game Tab Components
- `GameCanvasPlaceholder` - Main game view
- `ActionCard` - Horizontal scrolling action buttons
  - 7 actions: Pause, Speed x2, Speed x4, Save, Screenshot, Sound, Layout

### Build Tab Components
- Section Headers with hints
- `BuildingCard` - Buildings (8 items, horizontally scrollable)
- `BuildingCard` - Decorations (5 items, horizontally scrollable)
- Each card shows: Icon, Name, Cost

### Manage Tab Components
- `ManageButton` - 4 main buttons
  - Icon, Label, Description, Arrow indicator
  - Opens drawer on click

### Drawer Components
- `DrawerContent` - Conditional content based on type
- `StatCard` - Statistics with trend indicators
- `FinanceItem` - Finance rows with colored values
- `StaffMember` - Employee cards with avatar
- `SettingToggle` - Animated toggle switches

## 🎭 Animations Applied

### 1. Tab Indicator (Always Visible)
- Animated pink-to-blue gradient
- Smooth color shifting
- 3s loop

### 2. Drawer Opening (On Click)
- Slide up from bottom
- Elastic ease (cubic-bezier with bounce)
- 0.4s duration
- Overlay fade-in simultaneously

### 3. Building Icons (Continuous)
- Gentle pulse/breathing
- 2s loop
- Scale 1.0 → 1.05 → 1.0

### 4. Interactive Hover/Touch
- All buttons have 0.3s transitions
- Transform, background, border changes
- Smooth visual feedback

## 📱 Mobile Optimization

### Horizontal Scroll
- Native momentum scrolling
- No scrollbars (hidden via CSS)
- Swipe-friendly spacing
- Cards extend beyond viewport

### Touch Gestures
- Tap to select
- Swipe to scroll
- Tap outside to close drawer
- Pull-to-dismiss on drawer (future)

### Performance
- Hardware-accelerated animations (transform, opacity)
- Minimal repaints
- Efficient re-renders
- No layout thrashing

## 🔧 Technical Implementation

### State Management
```typescript
const [activeTab, setActiveTab] = useState<Tab>('game');
const [openDrawer, setOpenDrawer] = useState<DrawerType>(null);
```

### Drawer Types
```typescript
type DrawerType = 'statistics' | 'finance' | 'staff' | 'settings' | null;
```

### Layout Constraints
- Container: `height: 100%`, `overflow: hidden`
- Content area: `flex: 1`, `minHeight: 0`
- Scrollable areas: `overflowX: auto`, `scrollbarWidth: none`

## 💡 Key Design Decisions

### Why Bottom Tabs?
- Thumb-friendly on smartphones
- Industry standard (familiar UX)
- Always accessible

### Why Horizontal Scroll?
- Accommodates unlimited content
- Native touch behavior
- Space-efficient
- Discoverable (hint text + visual continuation)

### Why Drawers for Manage?
- Deep information hierarchy
- Focused context
- Temporary overlay
- Easy dismissal
- Animated reveal for polish

## 🚀 Future Enhancements

- [ ] Swipe gestures to switch tabs
- [ ] Pull-to-dismiss drawer
- [ ] Haptic feedback on interactions
- [ ] Spring physics for animations
- [ ] Skeleton loaders
- [ ] Optimistic UI updates
- [ ] Gesture hints for first-time users
- [ ] Landscape mode adaptations

---

**Status**: Focused implementation with full animations  
**Mobile-First**: 100% smartphone optimized  
**Viewport-Locked**: No page scrolling  
**Animations**: Smooth, performant, delightful
