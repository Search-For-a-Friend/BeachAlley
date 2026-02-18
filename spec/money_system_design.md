# Money System Design Document

## Overview
A comprehensive financial management system for Beach Alley that tracks player finances, handles transactions, manages staff costs, and provides win/lose conditions with real-time UI integration.

## 🎯 Core Features Implemented

### 1. Real-Time Financial Display
- **TopBar Integration**: Live money display with color-coded status
  - 🔴 Red: Negative money (debt)
  - 🟠 Orange: Low money (< $2,000)
  - 🟢 Green: Healthy money (≥ $2,000)
- **Win Progress**: Real-time percentage toward $50,000 victory
- **Finance Drawer**: Detailed financial breakdown in drawer system

### 2. Staff Management System
- **Automatic Hiring**: Staff created when establishments are built
- **Occupation-Based Costs**: Different roles have different daily salaries
- **Building-Specific Staffing**: Each building type requires specific staff combinations
- **Real-Time Cost Calculation**: Daily costs calculated from actual staff salaries

### 3. Customer Revenue System
- **Per-Customer Spending**: Revenue based on establishment type and group size
- **Lump Sum Payments**: Customers pay once when leaving establishments
- **Establishment Tracking**: Individual revenue tracking per establishment
- **Real-Time Updates**: Revenue immediately added to game state

### 4. Daily Operating Costs
- **Staff Salary Deduction**: All staff salaries deducted daily
- **Automatic Processing**: Costs applied at day advancement
- **Accurate Calculation**: Based on actual hired staff, not building estimates

### 5. Building Purchase System
- **Cost Validation**: Prevent building if insufficient funds
- **Real-Time Affordability**: Building cards show affordability status
- **Immediate Deduction**: Money deducted upon successful building placement
- **Staff Integration**: Staff automatically hired with building construction

## 🏗️ Technical Implementation

### Data Structures

#### GameState Extension
```typescript
interface GameState {
  // ... existing properties
  money: number;
  totalRevenue: number;
  totalExpenses: number;
  dayCount: number;
  isGameOver: boolean;
  gameWon: boolean;
  staff: Staff[]; // NEW: Staff management
}
```

#### Staff Interface
```typescript
interface Staff {
  id: string;
  name: string;
  occupation: string;
  establishmentId: string;
  dailyCost: number;
  efficiency: number; // 0.5 to 1.5 multiplier
}
```

#### Establishment Extension
```typescript
interface Establishment {
  // ... existing properties
  buildingType: string; // NEW: Store actual building type
  staffIds: string[]; // NEW: Linked staff members
  dailyStaffCost: number; // NEW: Calculated staff costs
  totalRevenue: number; // NEW: Revenue tracking
}
```

#### Building Cost Configuration
```typescript
interface BuildingCosts {
  buildCost: number;
  dailyCost: number; // Legacy, replaced by staff costs
  customerSpending: number;
  staffRequired: { occupation: string; dailyCost: number; count: number }[];
}
```

### Engine Functions

#### Money Management
- `addMoney(amount: number, type: TransactionType): void`
- `deductMoney(amount: number, type: TransactionType): boolean`
- `getMoney(): number`
- `canAfford(cost: number): boolean`

#### Staff Management
- `createStaffForEstablishment(establishmentId: string): Staff[]`
- `getStaffForEstablishment(establishmentId: string): Staff[]`
- `getAllStaff(): Staff[]`
- `removeStaff(staffId: string): boolean`

#### Daily Operations
- `processDailyCosts(): void` - Now uses staff salaries
- `advanceDay(): void`
- `checkWinLoseConditions(): void`

## 💰 Building Configuration

### Staff Requirements by Building Type

#### Beach Bar ($500 build cost)
- **Staff**: 1 Bartender ($80/day)
- **Customer Revenue**: $10 per customer
- **Daily Staff Cost**: $80

#### Sun Lounger ($100 build cost)
- **Staff**: 1 Attendant ($60/day)
- **Customer Revenue**: $5 per customer
- **Daily Staff Cost**: $60

#### Restaurant ($1,000 build cost)
- **Staff**: 1 Chef ($120) + 2 Waiters ($70 each)
- **Customer Revenue**: $25 per customer
- **Daily Staff Cost**: $260

#### Shop ($2,000 build cost)
- **Staff**: 1 Cashier ($75) + 1 Sales Assistant ($65)
- **Customer Revenue**: $30 per customer
- **Daily Staff Cost**: $140

#### Mall ($5,000 build cost)
- **Staff**: 1 Manager ($150) + 2 Cashiers ($75 each) + 1 Security Guard ($80)
- **Customer Revenue**: $50 per customer
- **Daily Staff Cost**: $380

## 🎮 Game Flow Integration

### Building Process
1. **Player selects building type** → Cost displayed in UI
2. **Affordability check** → Building card disabled if insufficient funds
3. **Placement validation** → Check terrain and space availability
4. **Money deduction** → Building cost deducted from player funds
5. **Establishment creation** → Building added to game state
6. **Automatic staff hiring** → All required staff created and assigned
7. **Daily cost calculation** → Staff costs begin accruing immediately

### Customer Revenue Flow
1. **Customer enters establishment** → Occupancy increases
2. **Service time passes** → Customer enjoys establishment
3. **Customer leaves establishment** → Lump sum payment processed
4. **Revenue calculation** → `customerSpending × groupSize`
5. **Money addition** → Added to game state and establishment total
6. **Real-time updates** → UI displays new totals immediately

### Daily Cost Processing
1. **Day advancement** → Triggered by time or manual action
2. **Staff cost calculation** → Sum of all staff daily salaries
3. **Money deduction** → Total staff costs deducted from player funds
4. **Expense tracking** → Added to total expenses
5. **Win/lose check** → Game state evaluated after deduction

## 🖥️ UI Integration

### TopBar Enhancements
```typescript
interface TopBarProps {
  money: number; // Real-time money display
  winProgress: number; // Percentage toward victory
}
```

### Finance Drawer Content
- **Cash on Hand**: Current money with color coding
- **Total Revenue**: Sum of all customer payments
- **Total Expenses**: Sum of all staff costs and building purchases
- **Day Counter**: Current game day
- **Building Count**: Total establishments owned
- **Game Status**: Playing/Victory/Game Over with messages

### Staff Drawer Features
- **Total Staff Count**: All hired staff across all establishments
- **Daily Staff Cost**: Sum of all staff salaries
- **Individual Staff Display**: 
  - Occupation icons (🍹 Bartender, 👨‍🍳 Chef, etc.)
  - Staff names and roles
  - Daily salary per staff member

### Establishment Drawer Enhancements
- **Selected Establishment Staff**: Staff members assigned to specific establishment
- **Daily Staff Costs**: Costs per establishment
- **Total Revenue**: Revenue per establishment
- **Performance Metrics**: Occupancy rates and visitor counts

## ⚖️ Balance Configuration

### Financial Thresholds
```typescript
const MONEY_THRESHOLDS = {
  STARTING_MONEY: 10000,
  LOSE_THRESHOLD: -5000,
  WIN_THRESHOLD: 50000,
} as const;
```

### Win Progress Calculation
```typescript
const winProgress = ((money + 5000) / 55000) * 100;
// Maps -$5,000 to 0% and $50,000 to 100%
```

## 🔧 Implementation Details

### Transaction Types
```typescript
type TransactionType = 
  | 'building_purchase'    // Building construction costs
  | 'daily_operations'    // Staff salary costs
  | 'customer_revenue'     // Customer payments
  | 'game_start';         // Initial money
```

### Real-Time Status Updates
- **Establishment States**: Updated based on occupancy (closed → visited → busy → crowded)
- **Money Changes**: Immediate UI updates on all transactions
- **Staff Creation**: Real-time staff list updates
- **Game State**: Win/lose conditions checked after each transaction

## 📊 Performance Tracking

### Establishment Metrics
- **Total Revenue**: Per-establishment revenue tracking
- **Total Visitors**: Customer count per establishment
- **Average Occupancy**: Percentage utilization across all establishments
- **Daily Staff Costs**: Per-establishment staffing expenses

### Financial Analytics
- **Revenue vs Expenses**: Daily profit/loss tracking
- **Staff Efficiency**: Cost per customer served
- **Building ROI**: Revenue vs construction and operating costs
- **Game Progress**: Time to reach win/lose conditions

## 🧪 Testing Considerations

### Balance Testing
- **Staff Cost Impact**: Verify different building combinations are viable
- **Revenue Flow**: Test customer traffic and payment processing
- **Win Timing**: Ensure $50,000 target is achievable but challenging
- **Lose Conditions**: Verify debt spiral mechanics work correctly

### Edge Cases
- **Zero Staff**: Handle establishments without staff (shouldn't occur)
- **Negative Money**: Ensure UI properly displays debt state
- **Rapid Building**: Test multiple quick building purchases
- **Staff Removal**: Verify cost recalculation when staff changes

## 🚀 Future Enhancements

### Advanced Staff Features
- **Staff Efficiency Impact**: Higher efficiency staff generate more revenue
- **Staff Training**: Invest in staff to improve performance
- **Staff Happiness**: Affect customer satisfaction and spending
- **Staff Management UI**: Hire/fire/promote staff interface

### Financial Systems
- **Loans and Interest**: Borrow money with interest payments
- **Investments**: Purchase upgrades that increase revenue
- **Dynamic Pricing**: Adjust prices based on demand and competition
- **Financial Reports**: Detailed profit/loss statements and trends

### UI Improvements
- **Money Change Animations**: Visual feedback for transactions
- **Revenue Graphs**: Charts showing income over time
- **Staff Performance Metrics**: Individual staff productivity
- **Financial Achievements**: Milestones and rewards system

## 📁 File Structure

### Core Engine Files
- `src/game/engine.ts` - Money and staff management logic
- `src/types/index.ts` - GameState, Staff, and BuildingCosts interfaces

### UI Components
- `src/layouts/LayoutTabbed.tsx` - Finance and staff drawer integration
- `src/components/TopBar.tsx` - Real-time money and progress display
- `src/components/FinancePanel.tsx` - Finance drawer content

### Configuration
- `src/types/index.ts` - BUILDING_COSTS and MONEY_THRESHOLDS constants

## 🎯 Success Metrics

### Player Experience
- **Clear Financial Feedback**: Players always know their financial status
- **Strategic Depth**: Staff costs create meaningful building decisions
- **Achievable Goals**: Win condition is reachable with good strategy
- **Risk Management**: Debt creates tension without being punitive

### Technical Performance
- **Real-Time Updates**: All financial data updates immediately
- **Memory Efficiency**: Staff and revenue tracking optimized
- **UI Responsiveness**: Financial displays don't impact game performance
- **Data Integrity**: No money loss or duplication bugs

---

*This design document reflects the current implementation as of the staff management system integration. All features described are fully implemented and functional in the game.*
