# Money System Design Document

## Overview
Implement a comprehensive money management system for the Beach Alley game that tracks player finances, handles transactions, and provides win/lose conditions.

## Core Features

### 1. Finance Panel Display
- **Location**: Main UI panel showing current money amount
- **Real-time updates**: Display changes immediately when transactions occur
- **Visual feedback**: Color coding for positive/negative changes
- **Currency format**: Proper formatting (e.g., "$1,000")

### 2. Customer Spending System
- **Per-customer revenue**: Each customer spends money based on establishment type
- **Variable amounts**: Different establishments generate different revenue
- **Timing**: Money added when customer completes service
- **Tracking**: Total daily revenue per establishment

### 3. Daily Operating Costs
- **Personnel costs**: Each establishment has daily staff expenses
- **Variable costs**: Different building sizes have different costs
- **Automatic deduction**: Costs applied at day end or specific intervals
- **Cost calculation**: Based on establishment type and capacity

### 4. Building Costs
- **Initial investment**: Money deducted when building is constructed
- **Type-based pricing**: Different buildings cost different amounts
- **Validation**: Prevent building if insufficient funds
- **Feedback**: Show cost in build UI and prevent invalid actions

### 5. Win/Lose Conditions
- **Lose condition**: Money goes below negative threshold (e.g., -$5,000)
- **Win condition**: Money exceeds positive threshold (e.g., $50,000)
- **Game state management**: Proper game over/victory screens
- **Thresholds**: Configurable values for balance testing

## Technical Implementation

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
}
```

#### Establishment Cost Configuration
```typescript
interface EstablishmentCosts {
  buildCost: number;
  dailyCost: number;
  customerSpending: number;
}
```

#### Money Transaction Types
```typescript
enum TransactionType {
  BUILDING_PURCHASE = 'building_purchase',
  DAILY_OPERATIONS = 'daily_operations',
  CUSTOMER_REVENUE = 'customer_revenue',
  GAME_START = 'game_start'
}
```

### Engine Functions

#### Money Management
- `addMoney(amount: number, type: TransactionType): void`
- `deductMoney(amount: number, type: TransactionType): boolean`
- `getMoney(): number`
- `canAfford(cost: number): boolean`

#### Daily Operations
- `processDailyCosts(): void`
- `calculateDailyCosts(): number`
- `advanceDay(): void`

#### Game State
- `checkWinLoseConditions(): void`
- `setGameOver(won: boolean): void`

### UI Components

#### Finance Panel
- Real-time money display
- Transaction history (optional)
- Daily revenue/expenses summary
- Win/lose progress indicators

#### Build Mode Integration
- Cost display in building cards
- Insufficient funds warning
- Money deduction on successful build
- Build prevention when broke

## Balance Considerations

### Initial Values
- **Starting money**: $10,000
- **Build costs**: 
  - Beach Bar: $500
  - Sun Lounger: $100
  - Restaurant: $1,000
  - Shop: $2,000
  - Mall: $5,000
- **Daily costs**:
  - Small buildings: $50/day
  - Medium buildings: $150/day
  - Large buildings: $400/day
- **Customer spending**:
  - Small buildings: $10/customer
  - Medium buildings: $25/customer
  - Large buildings: $50/customer

### Win/Lose Thresholds
- **Lose**: -$5,000 (debt limit)
- **Win**: $50,000 (success target)

## Implementation Steps

1. **Core Money System**
   - Extend GameState with money properties
   - Implement basic money management functions
   - Add transaction logging

2. **Finance Panel UI**
   - Create money display component
   - Add to main game layout
   - Implement real-time updates

3. **Building Costs**
   - Define cost configuration
   - Integrate with build system
   - Add cost validation

4. **Customer Revenue**
   - Hook into customer service completion
   - Add money per customer based on establishment
   - Track revenue per establishment

5. **Daily Costs**
   - Implement daily cost calculation
   - Add automatic deduction system
   - Create day advancement mechanism

6. **Win/Lose Conditions**
   - Implement threshold checking
   - Add game over/victory screens
   - Handle game state transitions

## Testing Considerations

### Balance Testing
- Test different starting money amounts
- Verify cost/revenue ratios
- Check win/lose timing
- Validate difficulty curve

### Edge Cases
- Zero money scenarios
- Rapid building/destruction
- Multiple simultaneous transactions
- Save/load with money state

## Future Enhancements

### Advanced Features
- Loans system
- Interest on debt
- Investment opportunities
- Staff management affecting costs
- Dynamic pricing based on demand

### UI Improvements
- Money change animations
- Detailed financial reports
- Graphs showing revenue trends
- Achievement system for financial milestones

## Files to Modify

### Core Engine
- `src/game/engine.ts` - Add money management
- `src/types/index.ts` - Extend GameState interface

### UI Components
- `src/layouts/LayoutTabbed.tsx` - Add finance panel
- `src/components/FinancePanel.tsx` - New component

### Configuration
- `src/config/buildings.ts` - Building costs and revenue
- `src/config/game.ts` - Money thresholds and settings
