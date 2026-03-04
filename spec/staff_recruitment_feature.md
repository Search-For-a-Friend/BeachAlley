# Staff Recruitment Feature Design Document

**Date**: 2026-03-04  
**Version**: 1.0  
**Status**: Design Specification  

---

## Overview

Replace the automatic staff creation system with an interactive recruitment process where players select candidates from a pool of applicants. This adds strategic depth to staff management and creates a more engaging hiring experience.

---

## User Flow

### Current Flow (Automatic)
1. Player builds establishment
2. Staff automatically created and assigned
3. Establishment immediately opens

### New Flow (Interactive Recruitment)
1. Player builds establishment
2. Establishment enters "closed" state (Establishment is closed until all required staff is hired)
3. Recruitment popup opens automatically
4. Player selects candidates for each required position
5. Once all positions filled, establishment opens automatically
6. Player can manually reopen recruitment later to replace staff

---

## Core Components

### 1. Recruitment Popup Modal

**Purpose**: Central interface for the hiring process

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  🏖️ Beach Bar - Recruitment                    [❌]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Position: Bartender (1/1 required)                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│  │  Card 1 │ │  Card 2 │ │  Card 3 │                    │
│  └─────────┘ └─────────┘ └─────────┘                    │
│                                                         │
│  [🔄 Reroll] [💰 Premium Reroll ($50)] [⏭️ Skip Later] │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Modal overlay with backdrop
- Position indicator (current/total required)
- Grid of candidate cards (2x2 or 3x2 based on screen size)
- Action buttons for rerolling candidates
- Skip option (hires temporary staff with lower performance)

### 2. Candidate Card Component

**Purpose**: Display individual candidate information

**Card Layout**:
```
┌─────────────────┐
│  👤 John Smith   │
│                 │
│  🖼️ [Photo]      │
│                 │
│  💰 $80/day     │
│  📅 5 years exp │
│  ⭐ 4.2 rating  │
│                 │
│  [HIRE]         │
└─────────────────┘
```

**Information Displayed**:
- **Photo**: Avatar/placeholder image
- **Name**: Generated first/last name
- **Salary**: Daily cost (varies by experience)
- **Experience**: Years in industry
- **Performance Rating**: 1-5 stars (affects efficiency)
- **Special Traits**: Optional bonuses (e.g., "Fast Service", "Friendly")

**Visual States**:
- Normal: Standard appearance
- Hovered: Highlighted with subtle glow
- Selected: Green border, checkmark overlay
- Disabled: Grayed out (when position filled)

### 3. Establishment State Logic

**Simplified State Management**:
- No special "recruiting" state needed
- Establishment automatically opens when all required staff are hired
- Establishment automatically closes when missing required staff
- Uses existing "open" and "closed" states based on staff completeness

**State Logic**:
```
Staff Complete → isOpen = true (normal operation states)
Staff Incomplete → isOpen = false (closed state)
```

**Visual Indicators**:
- **Closed**: Built structure with "CLOSED" banner + "Hiring Staff" subtitle
- **Open**: Normal open establishment appearance
- **Under Construction**: Building animation, scaffold graphics

**Behavior During Hiring**:
- Establishment appears built but remains closed
- No visitors can enter while staff incomplete
- No revenue generated until fully staffed
- Daily costs begin when first staff member is hired

## Candidate Generation System

### 1. Candidate Pool

**Generation Rules**:
- 3 candidates per position (standard pool)
- Names generated from predefined lists
- Photos selected from avatar library
- Stats balanced around position requirements

**Stat Ranges**:
```
Bartender:
- Salary: $60-120/day (base $80)
- Experience: 0-15 years
- Rating: 2.0-5.0 stars

Waiter:
- Salary: $50-100/day (base $70)
- Experience: 0-12 years  
- Rating: 2.5-5.0 stars

Chef:
- Salary: $80-150/day (base $100)
- Experience: 2-20 years
- Rating: 3.0-5.0 stars
```

### 2. Reroll System

**Free Reroll**:
- 1 free reroll per position
- Generates completely new candidate pool
- Available immediately

**Premium Reroll**:
- Costs $50 per use
- Generates higher-quality candidates (better stats)
- Unlimited uses (money permitting)
- 20% chance for "exceptional" candidates (5.0 rating)

### 3. Temporary Staff (Skip Option)

**When Player Skips**:
- Hires auto-generated staff with 3.0 rating
- 10% higher salary than base rate
- Can be replaced later through normal recruitment
- Allows player to proceed without making selections

---

## Technical Implementation

### 1. Data Structures

**New Interfaces**:
```typescript
interface StaffCandidate {
  id: string;
  name: string;
  occupation: string;
  photo: string; // avatar URL/identifier
  dailyCost: number;
  experience: number; // years
  rating: number; // 1-5 stars
  traits: string[]; // optional bonuses
  isTemporary: boolean;
}

interface RecruitmentState {
  establishmentId: string;
  currentPosition: number;
  totalPositions: number;
  currentOccupation: string;
  candidates: StaffCandidate[];
  freeRerollsUsed: number;
  isOpen: boolean;
}
```

### 2. Game Engine Changes

**New Methods**:
```typescript
class GameEngine {
  // Start recruitment process
  startRecruitment(establishmentId: string): void;
  
  // Generate candidate pool
  generateCandidates(occupation: string, premium: boolean): StaffCandidate[];
  
  // Hire selected candidate
  hireCandidate(establishmentId: string, candidate: StaffCandidate): void;
  
  // Reroll candidates
  rerollCandidates(establishmentId: string, premium: boolean): boolean;
  
  // Skip recruitment (hire temporary)
  skipRecruitment(establishmentId: string): void;
  
  // Complete recruitment process
  completeRecruitment(establishmentId: string): void;
}
```

**Modified Methods**:
```typescript
// Updated to trigger recruitment instead of auto-hiring
tryBuildEstablishment(...): boolean {
  // ... existing building logic
  
  // Instead of: this.createStaffForEstablishment(est.id);
  this.startRecruitment(est.id);
  
  // Set establishment to closed state
  est.state = 'closed';
}
```

### 3. UI Component Architecture

**Component Hierarchy**:
```
RecruitmentModal
├── RecruitmentHeader
├── CandidateGrid
│   └── CandidateCard (x4)
├── RecruitmentActions
│   ├── RerollButton
│   ├── PremiumRerollButton
│   └── SkipButton
└── RecruitmentProgress
```

**State Management**:
```typescript
// In main game component
const [recruitmentState, setRecruitmentState] = useState<RecruitmentState | null>(null);

// Event handlers
const handleHireCandidate = (candidate: StaffCandidate) => {
  gameEngine.hireCandidate(recruitmentState.establishmentId, candidate);
  // Update UI state
};

const handleReroll = (premium: boolean) => {
  const success = gameEngine.rerollCandidates(recruitmentState.establishmentId, premium);
  if (success) {
    // Refresh candidate pool
  }
};
```

---

## User Experience Considerations

### 1. Visual Feedback

**Establishment States**:
- **Under Construction**: Building animation, scaffold graphics
- **Closed**: Built structure with "CLOSED" banner
- **Ready**: Normal open establishment appearance

**Candidate Selection**:
- Smooth card selection animations
- Visual confirmation when candidate hired
- Progress bar showing recruitment completion

### 2. Mobile Optimization

**Responsive Layout**:
- Single column of cards on small screens
- Larger touch targets for mobile
- Swipe gestures for candidate navigation

**Performance**:
- Lazy loading of candidate photos
- Smooth animations at 60fps
- Minimal memory footprint

---

## Balancing and Economics

### 1. Cost Structure

**Recruitment Costs**:
- Free reroll: 1 per position
- Premium reroll: $50
- Temporary staff penalty: +10% salary

**Staff Performance Impact**:
- Rating 5.0: +25% efficiency, +20% salary
- Rating 4.0: +10% efficiency, +10% salary  
- Rating 3.0: Base efficiency, base salary
- Rating 2.0: -10% efficiency, -10% salary
- Rating 1.0: -25% efficiency, -20% salary

### 2. Strategic Depth

**Player Choices**:
- Invest in premium rerolls for better staff
- Accept average staff to save money
- Skip recruitment to open faster
- Replace underperforming staff later

**Long-term Planning**:
- Staff experience affects performance over time
- Training opportunities (future feature)
- Staff morale and retention (future feature)

---

## Technical Risks and Mitigations

### 1. Performance Concerns

**Risk**: Large candidate pools causing lag
**Mitigation**: 
- Limit to 3 candidates per position
- Reuse avatar assets
- Implement virtual scrolling if needed

### 2. State Management

**Risk**: Complex recruitment state causing bugs
**Mitigation**:
- Clear state machine documentation
- Comprehensive error handling
- State validation at each step

### 3. Balance Issues

**Risk**: Recruitment becoming tedious or unbalanced
**Mitigation**:
- Playtesting with different player types
- Analytics on recruitment patterns
- Adjustable parameters in config

---

## Future Enhancements

### Phase 2 Features:
- **Staff Training**: Improve ratings over time
- **Staff Morale**: Affects performance and retention
- **Referrals**: Better candidates from existing staff
- **Seasonal Workers**: Temporary high-performance options

### Phase 3 Features:
- **Staff Management UI**: View and manage all staff
- **Staff Schedules**: Optimize working hours
- **Staff Specialization**: Advanced skill trees
- **Staff Relationships**: Team dynamics affecting performance

---

## Success Metrics

### Player Engagement:
- Recruitment completion rate
- Time spent in recruitment UI
- Reroll usage patterns
- Staff replacement frequency

### Game Balance:
- Distribution of staff ratings
- Economic impact of recruitment choices
- Establishment performance correlation

### Technical Performance:
- Recruitment UI load time
- Memory usage during recruitment
- Error rates in recruitment flow

---

## Implementation Timeline

### Week 1: Core Systems
- [ ] Data structures and interfaces
- [ ] Candidate generation logic
- [ ] Basic recruitment modal

### Week 2: UI Components
- [ ] Candidate card component
- [ ] Recruitment actions
- [ ] State management integration

### Week 3: Game Integration
- [ ] Engine modifications
- [ ] Establishment state changes
- [ ] Economic balancing

### Week 4: Polish and Testing
- [ ] Visual feedback and animations
- [ ] Mobile optimization
- [ ] Playtesting and balancing

---

*This document serves as the complete specification for the staff recruitment feature. All implementation should follow these guidelines unless explicitly modified through the development process.*
