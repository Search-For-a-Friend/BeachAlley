# Group Interaction System - Feature Documentation

## Overview
Added interactive group selection and hover system with path visualization and detailed information panel.

## New Features

### 1. Mouse Interactions
- **Hover Detection**: Groups highlight when cursor hovers over them
- **Click Selection**: Click a group to select/deselect it
- **Visual Feedback**: 
  - Hovered groups: Pink border (#ff0080) with glow
  - Selected groups: Cyan border (#00ffff) with glow
  - Cursor changes to pointer when hovering

### 2. Path Visualization
- **Conditional Display**: Paths are now ONLY visible when a group is hovered or selected
- **Previous Behavior**: All groups with paths showed them at all times
- **New Behavior**: Clean view until interaction, then show path details

### 3. Group Details Panel
- **Trigger**: Clicking on a group opens the details panel
- **Modal Overlay**: Full-screen overlay with centered panel
- **Close**: Click outside panel or use X button
- **Auto-update**: Panel data updates in real-time as the group moves/changes state

### 4. Information Displayed

#### Group Details Panel Sections:
1. **Identity**
   - Group ID (first 8 chars)
   - Color swatch

2. **Composition**
   - Size (number of people)
   - Type (individual/small_group/big_group)

3. **Current State**
   - Visual state badge with emoji
   - States: spawning, idle, seeking, wandering, queuing, entering, visiting, leaving, despawned

4. **Position**
   - Grid X/Y coordinates (decimal precision)
   - Velocity X/Y (if available)

5. **Pathfinding** (if active)
   - Total waypoints count
   - Current waypoint progress (e.g., "3 / 7")
   - Next target coordinates

6. **Target** (if has target)
   - Target establishment ID

7. **Timings**
   - Spawn time
   - Visit start time (if visiting)
   - Visit duration (if visiting)

## Component Architecture

### New Component: `GroupDetailsPanel.tsx`
**Location**: `BeachAlley/sandbox/test_component_1/src/components/GroupDetailsPanel.tsx`

**Props**:
- `group: PeopleGroup | null` - The group to display (null = closed)
- `onClose: () => void` - Callback when panel should close

**Features**:
- Synthwave-themed styling (cyan/pink accent colors)
- Scrollable content for long details
- Modal overlay with backdrop
- Click-outside-to-close functionality

### Updated Component: `GameCanvas.tsx`

**New Props**:
- `hoveredGroupId?: string | null` - ID of currently hovered group
- `selectedGroupId?: string | null` - ID of currently selected group
- `onGroupClick?: (groupId: string) => void` - Callback when group is clicked
- `onGroupHover?: (groupId: string | null) => void` - Callback when hover changes

**New Functionality**:
- Mouse move event handler with collision detection
- Mouse click event handler
- Mouse leave handler (clears hover)
- Enhanced group rendering with hover/selected states
- Conditional path rendering

**Collision Detection**:
- Uses group radius + 5px margin
- Checks distance from mouse to group center
- Prioritizes first matching group (z-order)

### Updated Component: `App.tsx`

**New State**:
```typescript
const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
```

**New Handlers**:
- `handleGroupClick` - Toggle selection on/off
- `handleGroupHover` - Update hover state
- `handleCloseGroupDetails` - Clear selection

**Integration**:
- Passes interaction callbacks to GameCanvas
- Finds selected group from game state
- Renders GroupDetailsPanel when group selected
- Clears selection on reset

## User Experience

### Interaction Flow:
1. User moves mouse over canvas
2. Groups under cursor get pink highlight
3. User clicks highlighted group
4. Group gets cyan highlight (selected)
5. Details panel opens with full information
6. Path is visible while hovered/selected
7. Panel updates in real-time
8. User clicks outside or X to close
9. Group deselects, path hides

### Visual Hierarchy:
- **Default**: Groups with white border, no path
- **Hovered**: Pink border + glow + path visible
- **Selected**: Cyan border + glow + path visible + details panel
- **Both**: Selected state takes visual precedence

## Technical Details

### Coordinate System:
- Mouse coordinates converted from screen space to canvas space
- Group positions in grid coordinates converted to isometric screen space
- Collision detection in screen space for accuracy

### Performance:
- Collision detection on mouse move (O(n) where n = visible groups)
- Path rendering only for 1-2 groups max (hovered + selected)
- Details panel renders only when open

### State Management:
- Hover state: React state in App.tsx
- Selection state: React state in App.tsx
- Group data: From GameEngine via game state
- Real-time updates via game loop

## Future Enhancements (Potential)

1. **Multiple Selection**: Hold Shift to select multiple groups
2. **Group Filtering**: Filter which groups to show paths for
3. **Mini-Map**: Show all selected groups on mini-map
4. **Path History**: Show trail of where group has been
5. **Group Comparison**: Compare stats of multiple groups
6. **Quick Actions**: Buttons to despawn, teleport, or modify groups

## Files Modified

1. ✅ `src/components/GroupDetailsPanel.tsx` - NEW
2. ✅ `src/components/index.ts` - Export added
3. ✅ `src/components/GameCanvas.tsx` - Mouse interaction + conditional rendering
4. ✅ `src/App.tsx` - State management + panel integration

## Testing Checklist

- [x] Hover over group shows pink highlight
- [x] Hover shows path
- [x] Click selects group (cyan highlight)
- [x] Click opens details panel
- [x] Panel shows correct information
- [x] Panel updates in real-time
- [x] Click outside closes panel
- [x] X button closes panel
- [x] Deselected group hides path
- [x] Multiple groups can be hovered/selected sequentially
- [x] Works with manual spawn
- [x] Works with all group states (seeking, wandering, leaving, etc.)
