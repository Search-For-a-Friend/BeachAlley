# 🛠️ BEACH ALLEY - Technical Design Document
## Version 1.0 | February 2026

---

# 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Redux Architecture](#redux-architecture)
5. [Game Engine Architecture](#game-engine-architecture)
6. [Core Systems Implementation](#core-systems-implementation)
7. [Rendering System](#rendering-system)
8. [Data Models](#data-models)
9. [Event System](#event-system)
10. [Save/Load System](#saveload-system)
11. [Performance Optimization](#performance-optimization)
12. [Testing Strategy](#testing-strategy)
13. [Future Backend Integration](#future-backend-integration)

---

# 📖 OVERVIEW

## Document Purpose
This Technical Design Document (TDD) provides detailed specifications for implementing Beach Alley as a web-based tycoon game. It covers architecture decisions, data structures, system interactions, and implementation guidelines.

## Technical Goals
1. **Performance**: Maintain 60 FPS with 500+ simultaneous entities
2. **Modularity**: Feature-sliced architecture for easy expansion
3. **Maintainability**: Strong typing and clear separation of concerns
4. **Scalability**: Designed for future backend integration
5. **Testability**: High test coverage with predictable state management

## Architecture Philosophy
- **Redux as Event Bus**: All game events flow through Redux actions
- **ECS-Inspired Entities**: Game objects composed of typed components
- **Deterministic Simulation**: Game logic produces consistent results
- **React for UI Only**: Game canvas handled by PixiJS, React for overlays

---

# 🔧 TECHNOLOGY STACK

## Core Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@reduxjs/toolkit": "^2.2.0",
    "react-redux": "^9.1.0",
    "pixi.js": "^8.0.0",
    "@pixi/react": "^7.1.0",
    "howler": "^2.2.4",
    "immer": "^10.0.0",
    "date-fns": "^3.3.0",
    "uuid": "^9.0.0",
    "idb": "^8.0.0",
    "react-i18next": "^14.0.0",
    "i18next": "^23.0.0",
    "zustand": "^4.5.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.1.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "vitest": "^1.3.0",
    "@testing-library/react": "^14.2.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0"
  }
}
```

## Development Tools
| Tool | Purpose |
|------|---------|
| Vite | Build tool, HMR, dev server |
| TypeScript | Static typing |
| ESLint | Code quality |
| Prettier | Code formatting |
| Vitest | Unit testing |
| React DevTools | Component debugging |
| Redux DevTools | State debugging |

---

# 📁 PROJECT STRUCTURE

```
beach-alley/
├── public/
│   ├── assets/
│   │   ├── sprites/          # Pixel art spritesheets
│   │   │   ├── buildings/
│   │   │   ├── characters/
│   │   │   ├── decorations/
│   │   │   ├── terrain/
│   │   │   └── ui/
│   │   ├── audio/
│   │   │   ├── music/
│   │   │   └── sfx/
│   │   └── fonts/
│   ├── locales/              # i18n translation files
│   └── favicon.ico
│
├── src/
│   ├── app/                  # Application setup
│   │   ├── App.tsx
│   │   ├── store.ts          # Redux store configuration
│   │   ├── hooks.ts          # Typed Redux hooks
│   │   └── providers.tsx     # Context providers wrapper
│   │
│   ├── components/           # Shared UI components
│   │   ├── ui/               # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ...
│   │   └── common/           # Game-specific shared components
│   │       ├── CurrencyDisplay.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── IconButton.tsx
│   │       └── NotificationToast.tsx
│   │
│   ├── features/             # Feature modules (Redux slices + components)
│   │   ├── game/             # Core game loop
│   │   │   ├── gameSlice.ts
│   │   │   ├── gameSelectors.ts
│   │   │   ├── GameCanvas.tsx
│   │   │   ├── GameLoop.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── world/            # World/Map management
│   │   │   ├── worldSlice.ts
│   │   │   ├── worldSelectors.ts
│   │   │   ├── IsometricMap.tsx
│   │   │   ├── Tile.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── time/             # Time & calendar system
│   │   │   ├── timeSlice.ts
│   │   │   ├── timeSelectors.ts
│   │   │   ├── TimeControls.tsx
│   │   │   ├── Calendar.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── weather/          # Weather system
│   │   │   ├── weatherSlice.ts
│   │   │   ├── weatherSelectors.ts
│   │   │   ├── WeatherDisplay.tsx
│   │   │   ├── WeatherForecast.tsx
│   │   │   ├── weatherGenerator.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── economy/          # Money & transactions
│   │   │   ├── economySlice.ts
│   │   │   ├── economySelectors.ts
│   │   │   ├── FinancePanel.tsx
│   │   │   ├── TransactionLog.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── facilities/       # Buildings & facilities
│   │   │   ├── facilitiesSlice.ts
│   │   │   ├── facilitiesSelectors.ts
│   │   │   ├── BuildMenu.tsx
│   │   │   ├── FacilityCard.tsx
│   │   │   ├── FacilityInspector.tsx
│   │   │   ├── facilityDefinitions.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── tourists/         # Tourist simulation
│   │   │   ├── touristsSlice.ts
│   │   │   ├── touristsSelectors.ts
│   │   │   ├── TouristSprite.tsx
│   │   │   ├── touristAI.ts
│   │   │   ├── touristGenerator.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── staff/            # Staff management
│   │   │   ├── staffSlice.ts
│   │   │   ├── staffSelectors.ts
│   │   │   ├── StaffPanel.tsx
│   │   │   ├── StaffAssignment.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── vip/              # VIP system
│   │   │   ├── vipSlice.ts
│   │   │   ├── vipSelectors.ts
│   │   │   ├── VIPPanel.tsx
│   │   │   ├── VillaManager.tsx
│   │   │   ├── vipDefinitions.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── events/           # Special events system
│   │   │   ├── eventsSlice.ts
│   │   │   ├── eventsSelectors.ts
│   │   │   ├── EventsCalendar.tsx
│   │   │   ├── EventPlanner.tsx
│   │   │   ├── eventDefinitions.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── achievements/     # Achievement system
│   │   │   ├── achievementsSlice.ts
│   │   │   ├── achievementsSelectors.ts
│   │   │   ├── AchievementPopup.tsx
│   │   │   ├── achievementDefinitions.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── notifications/    # Notification system
│   │   │   ├── notificationsSlice.ts
│   │   │   ├── NotificationCenter.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── settings/         # Game settings
│   │   │   ├── settingsSlice.ts
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── types.ts
│   │   │
│   │   └── save/             # Save/Load system
│   │       ├── saveSlice.ts
│   │       ├── SaveLoadPanel.tsx
│   │       ├── persistence.ts
│   │       └── types.ts
│   │
│   ├── engine/               # Game engine core
│   │   ├── core/
│   │   │   ├── Engine.ts         # Main engine class
│   │   │   ├── GameClock.ts      # Time management
│   │   │   └── EventBus.ts       # Internal event system
│   │   │
│   │   ├── ecs/                  # Entity-Component System
│   │   │   ├── Entity.ts
│   │   │   ├── Component.ts
│   │   │   ├── System.ts
│   │   │   └── World.ts
│   │   │
│   │   ├── rendering/
│   │   │   ├── IsometricRenderer.ts
│   │   │   ├── SpriteManager.ts
│   │   │   ├── AnimationController.ts
│   │   │   ├── Camera.ts
│   │   │   └── LayerManager.ts
│   │   │
│   │   ├── pathfinding/
│   │   │   ├── AStar.ts
│   │   │   ├── NavGrid.ts
│   │   │   └── PathCache.ts
│   │   │
│   │   ├── simulation/
│   │   │   ├── EconomySimulator.ts
│   │   │   ├── TouristSimulator.ts
│   │   │   ├── WeatherSimulator.ts
│   │   │   └── FacilitySimulator.ts
│   │   │
│   │   └── audio/
│   │       ├── AudioManager.ts
│   │       ├── MusicPlayer.ts
│   │       └── SFXPlayer.ts
│   │
│   ├── layouts/              # Page layouts
│   │   ├── GameLayout.tsx
│   │   └── MenuLayout.tsx
│   │
│   ├── pages/                # Route pages
│   │   ├── MainMenu.tsx
│   │   ├── GamePage.tsx
│   │   ├── LoadGame.tsx
│   │   └── Settings.tsx
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useGameLoop.ts
│   │   ├── useKeyboard.ts
│   │   ├── useMouse.ts
│   │   ├── useAudio.ts
│   │   └── useAutoSave.ts
│   │
│   ├── utils/                # Utility functions
│   │   ├── math/
│   │   │   ├── isometric.ts      # Isometric coordinate conversion
│   │   │   ├── random.ts         # Seeded random number generator
│   │   │   └── interpolation.ts
│   │   ├── formatters.ts         # Number/date formatters
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   ├── types/                # Global TypeScript types
│   │   ├── entities.ts
│   │   ├── game.ts
│   │   ├── events.ts
│   │   └── index.ts
│   │
│   ├── styles/               # Global styles
│   │   ├── globals.css
│   │   ├── themes/
│   │   │   ├── synthwave.css
│   │   │   └── variables.css
│   │   └── animations.css
│   │
│   ├── lib/                  # Third-party integrations
│   │   └── utils.ts          # shadcn utility (cn function)
│   │
│   └── main.tsx              # Entry point
│
├── tests/                    # Test files
│   ├── unit/
│   ├── integration/
│   └── mocks/
│
├── .env                      # Environment variables
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
└── README.md
```

---

# 🏪 REDUX ARCHITECTURE

## Store Configuration

```typescript
// src/app/store.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { listenerMiddleware } from './listenerMiddleware';

// Feature reducers
import gameReducer from '@/features/game/gameSlice';
import worldReducer from '@/features/world/worldSlice';
import timeReducer from '@/features/time/timeSlice';
import weatherReducer from '@/features/weather/weatherSlice';
import economyReducer from '@/features/economy/economySlice';
import facilitiesReducer from '@/features/facilities/facilitiesSlice';
import touristsReducer from '@/features/tourists/touristsSlice';
import staffReducer from '@/features/staff/staffSlice';
import vipReducer from '@/features/vip/vipSlice';
import eventsReducer from '@/features/events/eventsSlice';
import achievementsReducer from '@/features/achievements/achievementsSlice';
import notificationsReducer from '@/features/notifications/notificationsSlice';
import settingsReducer from '@/features/settings/settingsSlice';
import saveReducer from '@/features/save/saveSlice';

const rootReducer = combineReducers({
  game: gameReducer,
  world: worldReducer,
  time: timeReducer,
  weather: weatherReducer,
  economy: economyReducer,
  facilities: facilitiesReducer,
  tourists: touristsReducer,
  staff: staffReducer,
  vip: vipReducer,
  events: eventsReducer,
  achievements: achievementsReducer,
  notifications: notificationsReducer,
  settings: settingsReducer,
  save: saveReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization check
        ignoredActions: ['game/tick'],
      },
    }).prepend(listenerMiddleware.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
```

## Typed Hooks

```typescript
// src/app/hooks.ts
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<typeof store>();
```

## Listener Middleware (Side Effects)

```typescript
// src/app/listenerMiddleware.ts
import { createListenerMiddleware, addListener } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from './store';

export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

// Example: React to time changes
startAppListening({
  actionCreator: timeActions.advanceHour,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState();
    
    // Trigger hourly simulation updates
    listenerApi.dispatch(weatherActions.updateWeather());
    listenerApi.dispatch(economyActions.calculateHourlyRevenue());
    listenerApi.dispatch(touristsActions.updateTouristNeeds());
    
    // Check for day change
    if (state.time.hour === 0) {
      listenerApi.dispatch(gameActions.onNewDay());
    }
  },
});
```

## Feature Slice Pattern

```typescript
// src/features/economy/economySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { EconomyState, Transaction, TransactionType } from './types';

const initialState: EconomyState = {
  balance: 50000,           // Starting money
  prestigePoints: 0,
  vipTokens: 0,
  transactions: [],
  dailyRevenue: 0,
  dailyExpenses: 0,
  statistics: {
    totalEarned: 0,
    totalSpent: 0,
    peakBalance: 50000,
  },
};

export const economySlice = createSlice({
  name: 'economy',
  initialState,
  reducers: {
    // Add money (revenue)
    addFunds: (state, action: PayloadAction<{
      amount: number;
      source: TransactionType;
      description?: string;
    }>) => {
      const { amount, source, description } = action.payload;
      state.balance += amount;
      state.dailyRevenue += amount;
      state.statistics.totalEarned += amount;
      
      if (state.balance > state.statistics.peakBalance) {
        state.statistics.peakBalance = state.balance;
      }
      
      state.transactions.push({
        id: crypto.randomUUID(),
        type: 'income',
        category: source,
        amount,
        description: description || source,
        timestamp: Date.now(),
      });
    },
    
    // Remove money (expenses)
    deductFunds: (state, action: PayloadAction<{
      amount: number;
      category: TransactionType;
      description?: string;
    }>) => {
      const { amount, category, description } = action.payload;
      state.balance -= amount;
      state.dailyExpenses += amount;
      state.statistics.totalSpent += amount;
      
      state.transactions.push({
        id: crypto.randomUUID(),
        type: 'expense',
        category,
        amount,
        description: description || category,
        timestamp: Date.now(),
      });
    },
    
    // Reset daily counters (called at midnight)
    resetDailyCounters: (state) => {
      state.dailyRevenue = 0;
      state.dailyExpenses = 0;
    },
    
    // Add prestige points
    addPrestige: (state, action: PayloadAction<number>) => {
      state.prestigePoints += action.payload;
    },
    
    // Add VIP tokens
    addVipTokens: (state, action: PayloadAction<number>) => {
      state.vipTokens += action.payload;
    },
    
    // Prune old transactions (keep last 1000)
    pruneTransactions: (state) => {
      if (state.transactions.length > 1000) {
        state.transactions = state.transactions.slice(-1000);
      }
    },
    
    // Load state (for save/load system)
    loadState: (state, action: PayloadAction<EconomyState>) => {
      return action.payload;
    },
  },
});

export const economyActions = economySlice.actions;
export default economySlice.reducer;
```

## Action Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REDUX ACTION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────────┐ │
│  │  USER    │────▶│   DISPATCH   │────▶│   REDUCER   │────▶│   STATE    │ │
│  │  ACTION  │     │   ACTION     │     │   UPDATE    │     │   CHANGE   │ │
│  └──────────┘     └──────────────┘     └─────────────┘     └────────────┘ │
│       │                  │                                        │        │
│       │                  ▼                                        │        │
│       │          ┌──────────────┐                                 │        │
│       │          │   LISTENER   │                                 │        │
│       │          │  MIDDLEWARE  │                                 │        │
│       │          └──────────────┘                                 │        │
│       │                  │                                        │        │
│       │                  ▼                                        │        │
│       │          ┌──────────────┐                                 │        │
│       │          │    SIDE      │                                 │        │
│       │          │   EFFECTS    │                                 │        │
│       │          │ (Simulation) │                                 │        │
│       │          └──────────────┘                                 │        │
│       │                  │                                        │        │
│       │                  ▼                                        ▼        │
│       │          ┌──────────────┐     ┌─────────────┐     ┌────────────┐ │
│       └─────────▶│  DISPATCH    │────▶│   UPDATE    │────▶│   REACT    │ │
│                  │  MORE ACTIONS│     │  SELECTORS  │     │ RE-RENDER  │ │
│                  └──────────────┘     └─────────────┘     └────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 🎮 GAME ENGINE ARCHITECTURE

## Engine Core

```typescript
// src/engine/core/Engine.ts
import { store } from '@/app/store';
import { gameActions } from '@/features/game/gameSlice';
import { GameClock } from './GameClock';
import { IsometricRenderer } from '../rendering/IsometricRenderer';
import { TouristSimulator } from '../simulation/TouristSimulator';
import { EconomySimulator } from '../simulation/EconomySimulator';
import { AudioManager } from '../audio/AudioManager';

export class Engine {
  private clock: GameClock;
  private renderer: IsometricRenderer;
  private simulators: Map<string, ISimulator>;
  private audioManager: AudioManager;
  private rafId: number | null = null;
  private lastTimestamp: number = 0;
  
  constructor(canvas: HTMLCanvasElement) {
    this.clock = new GameClock();
    this.renderer = new IsometricRenderer(canvas);
    this.audioManager = new AudioManager();
    
    // Initialize simulators
    this.simulators = new Map([
      ['tourists', new TouristSimulator()],
      ['economy', new EconomySimulator()],
      ['weather', new WeatherSimulator()],
      ['facilities', new FacilitySimulator()],
    ]);
  }
  
  start(): void {
    store.dispatch(gameActions.setRunning(true));
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }
  
  stop(): void {
    store.dispatch(gameActions.setRunning(false));
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  private loop(timestamp: number): void {
    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    
    const state = store.getState();
    
    if (state.game.isRunning && !state.game.isPaused) {
      // Update game clock based on speed setting
      const tickResult = this.clock.update(deltaTime, state.game.speed);
      
      if (tickResult.hourAdvanced) {
        store.dispatch(timeActions.advanceHour());
      }
      
      // Run simulators
      for (const [name, simulator] of this.simulators) {
        simulator.update(deltaTime, state);
      }
      
      // Dispatch tick action for UI updates
      store.dispatch(gameActions.tick({ deltaTime }));
    }
    
    // Always render (even when paused)
    this.renderer.render(state);
    
    // Continue loop
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }
  
  dispose(): void {
    this.stop();
    this.renderer.dispose();
    this.audioManager.dispose();
  }
}
```

## Game Clock

```typescript
// src/engine/core/GameClock.ts
import { GameSpeed } from '@/types/game';

export interface TickResult {
  hourAdvanced: boolean;
  dayAdvanced: boolean;
}

export class GameClock {
  private accumulatedTime: number = 0;
  
  // Time per game hour in milliseconds at different speeds
  private static readonly SPEED_MULTIPLIERS: Record<GameSpeed, number> = {
    paused: Infinity,
    normal: 120000,     // 2 minutes real = 1 hour game
    fast: 30000,        // 30 seconds real = 1 hour game
    ultra: 10000,       // 10 seconds real = 1 hour game
  };
  
  update(deltaTime: number, speed: GameSpeed): TickResult {
    const result: TickResult = {
      hourAdvanced: false,
      dayAdvanced: false,
    };
    
    if (speed === 'paused') {
      return result;
    }
    
    const timePerHour = GameClock.SPEED_MULTIPLIERS[speed];
    this.accumulatedTime += deltaTime;
    
    if (this.accumulatedTime >= timePerHour) {
      this.accumulatedTime -= timePerHour;
      result.hourAdvanced = true;
    }
    
    return result;
  }
  
  reset(): void {
    this.accumulatedTime = 0;
  }
}
```

## Simulator Interface

```typescript
// src/engine/simulation/ISimulator.ts
import type { RootState } from '@/app/store';

export interface ISimulator {
  update(deltaTime: number, state: RootState): void;
  reset(): void;
}
```

---

# ⚙️ CORE SYSTEMS IMPLEMENTATION

## Time System

```typescript
// src/features/time/types.ts
export interface TimeState {
  // Current game time
  year: number;
  month: number;      // 1-12
  day: number;        // 1-31
  hour: number;       // 0-23
  
  // Derived
  dayOfWeek: number;  // 0-6 (Sunday-Saturday)
  season: Season;
  timeOfDay: TimeOfDay;
  
  // Statistics
  totalDaysPlayed: number;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

// src/features/time/timeSlice.ts
const initialState: TimeState = {
  year: 2026,
  month: 5,           // May - start of beach season
  day: 1,
  hour: 8,            // 8 AM
  dayOfWeek: 5,       // Friday
  season: 'spring',
  timeOfDay: 'morning',
  totalDaysPlayed: 0,
};

export const timeSlice = createSlice({
  name: 'time',
  initialState,
  reducers: {
    advanceHour: (state) => {
      state.hour += 1;
      
      if (state.hour >= 24) {
        state.hour = 0;
        state.day += 1;
        state.dayOfWeek = (state.dayOfWeek + 1) % 7;
        state.totalDaysPlayed += 1;
        
        // Handle month overflow
        const daysInMonth = getDaysInMonth(state.year, state.month);
        if (state.day > daysInMonth) {
          state.day = 1;
          state.month += 1;
          
          // Handle year overflow
          if (state.month > 12) {
            state.month = 1;
            state.year += 1;
          }
        }
      }
      
      // Update derived values
      state.season = getSeason(state.month);
      state.timeOfDay = getTimeOfDay(state.hour);
    },
    
    setTime: (state, action: PayloadAction<Partial<TimeState>>) => {
      return { ...state, ...action.payload };
    },
  },
});
```

## Weather System

```typescript
// src/features/weather/types.ts
export type WeatherType = 
  | 'sunny' 
  | 'partly_cloudy' 
  | 'cloudy'
  | 'rainy' 
  | 'thunderstorm' 
  | 'heatwave' 
  | 'windy';

export interface WeatherCondition {
  type: WeatherType;
  temperature: number;        // Celsius
  humidity: number;           // 0-100
  windSpeed: number;          // km/h
  precipitation: number;      // 0-100
}

export interface WeatherForecast {
  day: number;
  condition: WeatherCondition;
  accuracy: number;           // 0-100
}

export interface WeatherState {
  current: WeatherCondition;
  forecast: WeatherForecast[];      // 14-day forecast
  forecastAccuracyBonus: number;    // From upgrades
}

// src/features/weather/weatherGenerator.ts
export class WeatherGenerator {
  private seed: number;
  private rng: SeededRandom;
  
  constructor(seed: number) {
    this.seed = seed;
    this.rng = new SeededRandom(seed);
  }
  
  generateForecast(currentDate: GameDate, days: number): WeatherForecast[] {
    const forecast: WeatherForecast[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = addDays(currentDate, i);
      const season = getSeason(date.month);
      
      // Base probabilities by season
      const baseWeather = this.getSeasonalBaseWeather(season);
      
      // Add some randomness
      const condition = this.generateCondition(baseWeather, date);
      
      // Accuracy decreases with distance
      const accuracy = Math.max(40, 95 - (i * 5));
      
      forecast.push({
        day: i,
        condition,
        accuracy,
      });
    }
    
    return forecast;
  }
  
  private getSeasonalBaseWeather(season: Season): WeatherProbabilities {
    const seasonalWeather: Record<Season, WeatherProbabilities> = {
      summer: {
        sunny: 0.5,
        partly_cloudy: 0.2,
        heatwave: 0.15,
        thunderstorm: 0.1,
        rainy: 0.05,
      },
      spring: {
        sunny: 0.3,
        partly_cloudy: 0.3,
        rainy: 0.2,
        cloudy: 0.15,
        windy: 0.05,
      },
      autumn: {
        partly_cloudy: 0.3,
        cloudy: 0.25,
        rainy: 0.2,
        windy: 0.15,
        sunny: 0.1,
      },
      winter: {
        cloudy: 0.35,
        rainy: 0.3,
        windy: 0.15,
        partly_cloudy: 0.1,
        sunny: 0.1,
      },
    };
    
    return seasonalWeather[season];
  }
}
```

## Tourist System

```typescript
// src/features/tourists/types.ts
export type TouristType = 
  | 'family'
  | 'student'
  | 'couple'
  | 'business'
  | 'retiree'
  | 'influencer'
  | 'vip';

export interface TouristNeeds {
  bathroom: number;       // 0-100
  thirst: number;         // 0-100
  hunger: number;         // 0-100
  energy: number;         // 0-100
  entertainment: number;  // 0-100
  comfort: number;        // 0-100
}

export interface Tourist {
  id: string;
  type: TouristType;
  
  // Position
  position: Vector2;
  targetPosition: Vector2 | null;
  currentPath: Vector2[];
  
  // State
  needs: TouristNeeds;
  satisfaction: number;   // 0-100
  money: number;          // Budget remaining
  
  // Behavior
  state: TouristState;
  currentActivity: string | null;
  targetFacility: string | null;
  
  // Timing
  arrivalTime: number;
  departureTime: number;  // When they plan to leave
  
  // Visual
  spriteVariant: number;
  direction: Direction;
}

export type TouristState = 
  | 'entering'
  | 'wandering'
  | 'seeking'        // Looking for facility
  | 'queuing'
  | 'using_facility'
  | 'leaving'
  | 'idle';

// src/features/tourists/touristAI.ts
export class TouristAI {
  static decideBehavior(tourist: Tourist, facilities: Facility[]): TouristAction {
    // Priority 1: Critical needs
    if (tourist.needs.bathroom > 80) {
      const restroom = this.findNearestFacility(tourist, facilities, 'restroom');
      if (restroom) return { type: 'seek_facility', facilityId: restroom.id };
    }
    
    if (tourist.needs.thirst > 70) {
      const drinkShop = this.findNearestFacility(tourist, facilities, 'drink');
      if (drinkShop) return { type: 'seek_facility', facilityId: drinkShop.id };
    }
    
    // Priority 2: Moderate needs
    if (tourist.needs.hunger > 60) {
      const foodShop = this.findNearestFacility(tourist, facilities, 'food');
      if (foodShop) return { type: 'seek_facility', facilityId: foodShop.id };
    }
    
    // Priority 3: Entertainment
    if (tourist.needs.entertainment > 50) {
      const entertainment = this.findMatchingFacility(
        tourist,
        facilities,
        TOURIST_PREFERENCES[tourist.type]
      );
      if (entertainment) return { type: 'seek_facility', facilityId: entertainment.id };
    }
    
    // Default: Wander
    return { type: 'wander' };
  }
  
  static updateNeeds(tourist: Tourist, deltaTime: number): TouristNeeds {
    const decayRate = 0.001 * deltaTime; // Per millisecond
    
    return {
      bathroom: Math.min(100, tourist.needs.bathroom + decayRate * 2),
      thirst: Math.min(100, tourist.needs.thirst + decayRate * 1.5),
      hunger: Math.min(100, tourist.needs.hunger + decayRate),
      energy: Math.min(100, tourist.needs.energy + decayRate * 0.5),
      entertainment: Math.min(100, tourist.needs.entertainment + decayRate),
      comfort: tourist.needs.comfort, // Affected by other factors
    };
  }
}
```

## Facility System

```typescript
// src/features/facilities/types.ts
export type FacilityCategory = 
  | 'beach_essential'
  | 'food_beverage'
  | 'entertainment'
  | 'retail'
  | 'nightlife'
  | 'vip';

export type FacilityTier = 'bronze' | 'silver' | 'gold';

export interface FacilityDefinition {
  id: string;
  name: string;
  category: FacilityCategory;
  
  // Costs
  buildCost: number;
  maintenanceCost: number;      // Per day
  staffRequired: number;
  
  // Properties
  capacity: number;
  serviceTime: number;          // Seconds per customer
  revenue: { min: number; max: number };
  
  // Grid
  size: { width: number; height: number };
  
  // Requirements
  unlockLevel: number;
  prerequisites: string[];
  
  // Upgrades
  upgrades: Record<FacilityTier, FacilityUpgrade>;
}

export interface Facility {
  id: string;
  definitionId: string;
  
  // Position
  gridPosition: GridPosition;
  
  // State
  tier: FacilityTier;
  isOperating: boolean;
  condition: number;            // 0-100, affects efficiency
  
  // Queue
  queue: string[];              // Tourist IDs
  currentCustomer: string | null;
  serviceProgress: number;
  
  // Staff
  assignedStaff: string[];
  
  // Statistics
  dailyCustomers: number;
  dailyRevenue: number;
  totalRevenue: number;
  
  // Upgrades
  customizations: FacilityCustomization[];
}

// src/features/facilities/facilityDefinitions.ts
export const FACILITY_DEFINITIONS: Record<string, FacilityDefinition> = {
  umbrella_rental: {
    id: 'umbrella_rental',
    name: 'Umbrella Rental',
    category: 'beach_essential',
    buildCost: 500,
    maintenanceCost: 20,
    staffRequired: 0,
    capacity: 20,
    serviceTime: 30,
    revenue: { min: 5, max: 15 },
    size: { width: 2, height: 2 },
    unlockLevel: 1,
    prerequisites: [],
    upgrades: {
      bronze: { capacityMultiplier: 1, revenueMultiplier: 1 },
      silver: { capacityMultiplier: 1.25, revenueMultiplier: 1.15 },
      gold: { capacityMultiplier: 1.5, revenueMultiplier: 1.3 },
    },
  },
  
  ice_cream_stand: {
    id: 'ice_cream_stand',
    name: 'Ice Cream Stand',
    category: 'food_beverage',
    buildCost: 3000,
    maintenanceCost: 50,
    staffRequired: 1,
    capacity: 10,
    serviceTime: 45,
    revenue: { min: 8, max: 25 },
    size: { width: 2, height: 2 },
    unlockLevel: 1,
    prerequisites: [],
    upgrades: {
      bronze: { capacityMultiplier: 1, revenueMultiplier: 1, flavors: 4 },
      silver: { capacityMultiplier: 1.25, revenueMultiplier: 1.2, flavors: 8 },
      gold: { capacityMultiplier: 1.5, revenueMultiplier: 1.4, flavors: 16 },
    },
  },
  
  // ... more facilities
};
```

---

# 🎨 RENDERING SYSTEM

## Isometric Coordinate System

```typescript
// src/utils/math/isometric.ts

/**
 * Isometric coordinate conversion utilities
 * Uses 2:1 ratio isometric projection
 */

export interface GridPosition {
  x: number;  // Grid X (horizontal)
  y: number;  // Grid Y (vertical)
}

export interface ScreenPosition {
  x: number;  // Screen X (pixels)
  y: number;  // Screen Y (pixels)
}

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

/**
 * Convert grid coordinates to screen coordinates
 */
export function gridToScreen(grid: GridPosition): ScreenPosition {
  return {
    x: (grid.x - grid.y) * (TILE_WIDTH / 2),
    y: (grid.x + grid.y) * (TILE_HEIGHT / 2),
  };
}

/**
 * Convert screen coordinates to grid coordinates
 */
export function screenToGrid(screen: ScreenPosition): GridPosition {
  const x = (screen.x / (TILE_WIDTH / 2) + screen.y / (TILE_HEIGHT / 2)) / 2;
  const y = (screen.y / (TILE_HEIGHT / 2) - screen.x / (TILE_WIDTH / 2)) / 2;
  
  return {
    x: Math.floor(x),
    y: Math.floor(y),
  };
}

/**
 * Get rendering depth for z-ordering
 * Higher depth = rendered later (on top)
 */
export function getDepth(grid: GridPosition, layer: number = 0): number {
  return (grid.x + grid.y) * 100 + layer;
}

/**
 * Check if a screen point is within a tile at grid position
 */
export function isPointInTile(screen: ScreenPosition, tileGrid: GridPosition): boolean {
  const tileScreen = gridToScreen(tileGrid);
  
  // Diamond hit test
  const dx = Math.abs(screen.x - tileScreen.x);
  const dy = Math.abs(screen.y - tileScreen.y);
  
  return (dx / (TILE_WIDTH / 2) + dy / (TILE_HEIGHT / 2)) <= 1;
}
```

## Isometric Renderer

```typescript
// src/engine/rendering/IsometricRenderer.ts
import * as PIXI from 'pixi.js';
import { gridToScreen, getDepth, TILE_WIDTH, TILE_HEIGHT } from '@/utils/math/isometric';
import { Camera } from './Camera';
import { LayerManager, Layer } from './LayerManager';
import { SpriteManager } from './SpriteManager';
import type { RootState } from '@/app/store';

export class IsometricRenderer {
  private app: PIXI.Application;
  private camera: Camera;
  private layers: LayerManager;
  private sprites: SpriteManager;
  
  // Sprite pools for performance
  private tilePool: PIXI.Sprite[] = [];
  private characterPool: PIXI.AnimatedSprite[] = [];
  
  constructor(canvas: HTMLCanvasElement) {
    this.app = new PIXI.Application();
    this.camera = new Camera(canvas.width, canvas.height);
    this.layers = new LayerManager(this.app.stage);
    this.sprites = new SpriteManager();
  }
  
  async initialize(): Promise<void> {
    await this.app.init({
      canvas: document.getElementById('game-canvas') as HTMLCanvasElement,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1a1a2e,
      antialias: false,           // Pixel art should not be anti-aliased
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    // Set up layers
    this.layers.createLayer('terrain', 0);
    this.layers.createLayer('water', 1);
    this.layers.createLayer('facilities', 2);
    this.layers.createLayer('characters', 3);
    this.layers.createLayer('effects', 4);
    this.layers.createLayer('ui-world', 5);
    
    // Load sprite atlases
    await this.sprites.loadAtlas('terrain', '/assets/sprites/terrain/terrain.json');
    await this.sprites.loadAtlas('buildings', '/assets/sprites/buildings/buildings.json');
    await this.sprites.loadAtlas('characters', '/assets/sprites/characters/characters.json');
  }
  
  render(state: RootState): void {
    // Update camera from state
    this.camera.update(state.game.camera);
    
    // Clear and rebuild visible sprites
    this.renderTerrain(state.world);
    this.renderFacilities(state.facilities, state.world);
    this.renderTourists(state.tourists);
    this.renderEffects(state);
    
    // Apply camera transform
    this.app.stage.position.set(
      -this.camera.x + this.app.screen.width / 2,
      -this.camera.y + this.app.screen.height / 2
    );
    this.app.stage.scale.set(this.camera.zoom);
  }
  
  private renderTerrain(worldState: WorldState): void {
    const terrainLayer = this.layers.getLayer('terrain');
    const visibleTiles = this.getVisibleTiles();
    
    for (const tile of visibleTiles) {
      const screenPos = gridToScreen(tile.position);
      const sprite = this.getTileSprite(tile.type);
      
      sprite.position.set(screenPos.x, screenPos.y);
      sprite.zIndex = getDepth(tile.position, 0);
      
      terrainLayer.addChild(sprite);
    }
    
    terrainLayer.sortChildren();
  }
  
  private renderFacilities(facilitiesState: FacilitiesState, worldState: WorldState): void {
    const facilityLayer = this.layers.getLayer('facilities');
    
    for (const facility of Object.values(facilitiesState.entities)) {
      const screenPos = gridToScreen(facility.gridPosition);
      const sprite = this.sprites.getFacilitySprite(
        facility.definitionId,
        facility.tier
      );
      
      sprite.position.set(screenPos.x, screenPos.y);
      sprite.zIndex = getDepth(facility.gridPosition, 1);
      
      // Apply time-of-day lighting
      this.applyLighting(sprite, worldState.timeOfDay);
      
      facilityLayer.addChild(sprite);
    }
    
    facilityLayer.sortChildren();
  }
  
  private renderTourists(touristsState: TouristsState): void {
    const characterLayer = this.layers.getLayer('characters');
    
    for (const tourist of Object.values(touristsState.entities)) {
      const screenPos = gridToScreen({
        x: tourist.position.x,
        y: tourist.position.y,
      });
      
      const sprite = this.getCharacterSprite(tourist);
      sprite.position.set(screenPos.x, screenPos.y);
      sprite.zIndex = getDepth(
        { x: Math.floor(tourist.position.x), y: Math.floor(tourist.position.y) },
        2
      );
      
      characterLayer.addChild(sprite);
    }
    
    characterLayer.sortChildren();
  }
  
  dispose(): void {
    this.app.destroy(true, { children: true, texture: true });
  }
}
```

## Layer Manager

```typescript
// src/engine/rendering/LayerManager.ts
import * as PIXI from 'pixi.js';

export class LayerManager {
  private layers: Map<string, PIXI.Container> = new Map();
  private stage: PIXI.Container;
  
  constructor(stage: PIXI.Container) {
    this.stage = stage;
  }
  
  createLayer(name: string, zIndex: number): PIXI.Container {
    const container = new PIXI.Container();
    container.sortableChildren = true;
    container.zIndex = zIndex;
    
    this.layers.set(name, container);
    this.stage.addChild(container);
    this.stage.sortChildren();
    
    return container;
  }
  
  getLayer(name: string): PIXI.Container {
    const layer = this.layers.get(name);
    if (!layer) {
      throw new Error(`Layer "${name}" not found`);
    }
    return layer;
  }
  
  clearLayer(name: string): void {
    const layer = this.getLayer(name);
    layer.removeChildren();
  }
  
  clearAll(): void {
    for (const layer of this.layers.values()) {
      layer.removeChildren();
    }
  }
}
```

---

# 📊 DATA MODELS

## Entity Types

```typescript
// src/types/entities.ts

// Base entity interface
export interface Entity {
  id: string;
  type: EntityType;
  createdAt: number;
  updatedAt: number;
}

export type EntityType = 
  | 'facility'
  | 'tourist'
  | 'staff'
  | 'vip'
  | 'decoration'
  | 'event';

// Position types
export interface Vector2 {
  x: number;
  y: number;
}

export interface GridPosition {
  x: number;
  y: number;
}

export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
```

## Game State Schema

```typescript
// src/types/game.ts

export interface GameState {
  // Meta
  version: string;
  saveId: string;
  createdAt: number;
  playTime: number;           // Total seconds played
  
  // Core state
  isRunning: boolean;
  isPaused: boolean;
  speed: GameSpeed;
  
  // Camera
  camera: CameraState;
  
  // Player progress
  level: number;
  reputation: number;
  achievements: string[];
  
  // Tutorial
  tutorialCompleted: boolean;
  tutorialStep: number;
}

export type GameSpeed = 'paused' | 'normal' | 'fast' | 'ultra';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: 0 | 90 | 180 | 270;
}
```

## World State Schema

```typescript
// src/features/world/types.ts

export interface WorldState {
  // Map dimensions
  width: number;
  height: number;
  
  // Tiles
  tiles: Record<string, Tile>;    // Key: "x,y"
  
  // Zones
  zones: Zone[];
  
  // Time-based state
  timeOfDay: TimeOfDay;
  season: Season;
}

export interface Tile {
  position: GridPosition;
  type: TileType;
  variant: number;
  
  // Occupancy
  facilityId: string | null;
  decorationId: string | null;
  
  // Properties
  isWalkable: boolean;
  isWater: boolean;
  isBuildable: boolean;
}

export type TileType = 
  | 'sand'
  | 'wet_sand'
  | 'water_shallow'
  | 'water_deep'
  | 'grass'
  | 'path_sand'
  | 'path_wood'
  | 'path_stone'
  | 'concrete';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  bounds: { start: GridPosition; end: GridPosition };
  unlocked: boolean;
}

export type ZoneType = 
  | 'beach'
  | 'boardwalk'
  | 'commercial'
  | 'entertainment'
  | 'vip_district'
  | 'parking';
```

## Save Data Structure

```typescript
// src/features/save/types.ts

export interface SaveData {
  // Meta
  meta: SaveMeta;
  
  // Full state snapshot
  state: {
    game: GameState;
    world: WorldState;
    time: TimeState;
    weather: WeatherState;
    economy: EconomyState;
    facilities: FacilitiesState;
    tourists: TouristsState;
    staff: StaffState;
    vip: VIPState;
    events: EventsState;
    achievements: AchievementsState;
    settings: SettingsState;
  };
}

export interface SaveMeta {
  id: string;
  name: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  playTime: number;
  
  // Preview data
  preview: {
    level: number;
    balance: number;
    reputation: number;
    date: string;
    thumbnail?: string;    // Base64 screenshot
  };
}

export interface SaveSlot {
  index: number;
  isEmpty: boolean;
  meta?: SaveMeta;
}
```

---

# 📡 EVENT SYSTEM

## Redux Action Types

```typescript
// src/types/events.ts

// Game lifecycle events
export const GAME_EVENTS = {
  // Core
  GAME_START: 'game/start',
  GAME_PAUSE: 'game/pause',
  GAME_RESUME: 'game/resume',
  GAME_TICK: 'game/tick',
  
  // Time
  HOUR_CHANGED: 'time/hourChanged',
  DAY_CHANGED: 'time/dayChanged',
  SEASON_CHANGED: 'time/seasonChanged',
  
  // Economy
  TRANSACTION: 'economy/transaction',
  DAILY_REPORT: 'economy/dailyReport',
  
  // Facilities
  FACILITY_BUILT: 'facilities/built',
  FACILITY_UPGRADED: 'facilities/upgraded',
  FACILITY_DEMOLISHED: 'facilities/demolished',
  FACILITY_BREAKDOWN: 'facilities/breakdown',
  
  // Tourists
  TOURIST_ARRIVED: 'tourists/arrived',
  TOURIST_LEFT: 'tourists/left',
  TOURIST_SATISFACTION_CHANGED: 'tourists/satisfactionChanged',
  
  // VIP
  VIP_INTEREST: 'vip/interest',
  VIP_VISIT: 'vip/visit',
  VIP_VILLA_PURCHASED: 'vip/villaPurchased',
  
  // Weather
  WEATHER_CHANGED: 'weather/changed',
  STORM_WARNING: 'weather/stormWarning',
  
  // Events
  EVENT_STARTED: 'events/started',
  EVENT_ENDED: 'events/ended',
  
  // Achievements
  ACHIEVEMENT_UNLOCKED: 'achievements/unlocked',
} as const;
```

## Event Listener Setup

```typescript
// src/app/eventListeners.ts
import { startAppListening } from './listenerMiddleware';
import { gameActions } from '@/features/game/gameSlice';
import { economyActions } from '@/features/economy/economySlice';
import { achievementsActions } from '@/features/achievements/achievementsSlice';
import { notificationsActions } from '@/features/notifications/notificationsSlice';

// Listen for facility built events
startAppListening({
  actionCreator: facilitiesActions.buildFacility,
  effect: (action, listenerApi) => {
    const state = listenerApi.getState();
    const facility = action.payload;
    
    // Deduct cost
    listenerApi.dispatch(economyActions.deductFunds({
      amount: facility.cost,
      category: 'construction',
      description: `Built ${facility.name}`,
    }));
    
    // Add reputation
    listenerApi.dispatch(gameActions.addReputation(10));
    
    // Check achievements
    const facilityCount = Object.keys(state.facilities.entities).length + 1;
    if (facilityCount === 10) {
      listenerApi.dispatch(achievementsActions.unlock('builder_10'));
    }
    
    // Show notification
    listenerApi.dispatch(notificationsActions.add({
      type: 'success',
      title: 'Construction Complete',
      message: `${facility.name} is now open!`,
    }));
  },
});

// Listen for daily changes
startAppListening({
  predicate: (action, currentState, previousState) => {
    return currentState.time.day !== previousState.time.day;
  },
  effect: (action, listenerApi) => {
    // Calculate daily finances
    listenerApi.dispatch(economyActions.calculateDailyReport());
    
    // Pay staff wages
    listenerApi.dispatch(staffActions.payWages());
    
    // Pay maintenance
    listenerApi.dispatch(facilitiesActions.payMaintenance());
    
    // Reset daily counters
    listenerApi.dispatch(economyActions.resetDailyCounters());
    listenerApi.dispatch(touristsActions.resetDailyStats());
    listenerApi.dispatch(facilitiesActions.resetDailyStats());
    
    // Advance weather
    listenerApi.dispatch(weatherActions.advanceDay());
    
    // Check for events
    listenerApi.dispatch(eventsActions.checkDailyEvents());
    
    // Auto-save
    listenerApi.dispatch(saveActions.autoSave());
  },
});

// Listen for revenue events
startAppListening({
  actionCreator: economyActions.addFunds,
  effect: (action, listenerApi) => {
    const state = listenerApi.getState();
    
    // Achievement: First million
    if (state.economy.statistics.totalEarned >= 1000000) {
      listenerApi.dispatch(achievementsActions.unlock('millionaire'));
    }
  },
});
```

---

# 💾 SAVE/LOAD SYSTEM

## IndexedDB Persistence

```typescript
// src/features/save/persistence.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { SaveData, SaveSlot } from './types';

interface BeachAlleyDB extends DBSchema {
  saves: {
    key: string;
    value: SaveData;
    indexes: { 'by-updated': number };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

class SaveManager {
  private db: IDBPDatabase<BeachAlleyDB> | null = null;
  private readonly DB_NAME = 'beach-alley-saves';
  private readonly DB_VERSION = 1;
  private readonly MAX_SLOTS = 10;
  
  async initialize(): Promise<void> {
    this.db = await openDB<BeachAlleyDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Saves store
        const saveStore = db.createObjectStore('saves', {
          keyPath: 'meta.id',
        });
        saveStore.createIndex('by-updated', 'meta.updatedAt');
        
        // Settings store
        db.createObjectStore('settings');
      },
    });
  }
  
  async save(slotIndex: number, data: SaveData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const saveId = `slot-${slotIndex}`;
    const saveData: SaveData = {
      ...data,
      meta: {
        ...data.meta,
        id: saveId,
        updatedAt: Date.now(),
      },
    };
    
    await this.db.put('saves', saveData);
  }
  
  async load(slotIndex: number): Promise<SaveData | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const saveId = `slot-${slotIndex}`;
    return await this.db.get('saves', saveId) || null;
  }
  
  async delete(slotIndex: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const saveId = `slot-${slotIndex}`;
    await this.db.delete('saves', saveId);
  }
  
  async getSlots(): Promise<SaveSlot[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const slots: SaveSlot[] = [];
    
    for (let i = 0; i < this.MAX_SLOTS; i++) {
      const saveId = `slot-${i}`;
      const save = await this.db.get('saves', saveId);
      
      slots.push({
        index: i,
        isEmpty: !save,
        meta: save?.meta,
      });
    }
    
    return slots;
  }
  
  // Export save as JSON file
  async exportSave(slotIndex: number): Promise<string> {
    const data = await this.load(slotIndex);
    if (!data) throw new Error('Save not found');
    
    return JSON.stringify(data, null, 2);
  }
  
  // Import save from JSON
  async importSave(slotIndex: number, jsonString: string): Promise<void> {
    const data: SaveData = JSON.parse(jsonString);
    
    // Validate version compatibility
    if (!this.isVersionCompatible(data.meta.version)) {
      throw new Error('Incompatible save version');
    }
    
    await this.save(slotIndex, data);
  }
  
  private isVersionCompatible(version: string): boolean {
    // Implement version checking logic
    const [major] = version.split('.');
    const [currentMajor] = GAME_VERSION.split('.');
    return major === currentMajor;
  }
}

export const saveManager = new SaveManager();
```

## Save Slice

```typescript
// src/features/save/saveSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { saveManager } from './persistence';
import type { RootState } from '@/app/store';
import type { SaveSlot, SaveData } from './types';

interface SaveState {
  slots: SaveSlot[];
  currentSlot: number | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaveTime: number | null;
  autoSaveEnabled: boolean;
  error: string | null;
}

const initialState: SaveState = {
  slots: [],
  currentSlot: null,
  isLoading: false,
  isSaving: false,
  lastSaveTime: null,
  autoSaveEnabled: true,
  error: null,
};

// Async thunks
export const loadSlots = createAsyncThunk(
  'save/loadSlots',
  async () => {
    await saveManager.initialize();
    return await saveManager.getSlots();
  }
);

export const saveGame = createAsyncThunk(
  'save/saveGame',
  async (slotIndex: number, { getState }) => {
    const state = getState() as RootState;
    
    const saveData: SaveData = {
      meta: {
        id: `slot-${slotIndex}`,
        name: `Save ${slotIndex + 1}`,
        version: GAME_VERSION,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        playTime: state.game.playTime,
        preview: {
          level: state.game.level,
          balance: state.economy.balance,
          reputation: state.game.reputation,
          date: `${state.time.month}/${state.time.day}/${state.time.year}`,
        },
      },
      state: {
        game: state.game,
        world: state.world,
        time: state.time,
        weather: state.weather,
        economy: state.economy,
        facilities: state.facilities,
        tourists: { ...state.tourists, entities: {} }, // Don't save tourists
        staff: state.staff,
        vip: state.vip,
        events: state.events,
        achievements: state.achievements,
        settings: state.settings,
      },
    };
    
    await saveManager.save(slotIndex, saveData);
    return { slotIndex, timestamp: Date.now() };
  }
);

export const loadGame = createAsyncThunk(
  'save/loadGame',
  async (slotIndex: number) => {
    const saveData = await saveManager.load(slotIndex);
    if (!saveData) throw new Error('Save not found');
    return saveData;
  }
);

export const saveSlice = createSlice({
  name: 'save',
  initialState,
  reducers: {
    setAutoSave: (state, action: PayloadAction<boolean>) => {
      state.autoSaveEnabled = action.payload;
    },
    autoSave: (state) => {
      // Trigger auto-save if enabled and slot is selected
      if (state.autoSaveEnabled && state.currentSlot !== null) {
        // Will be handled by listener middleware
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSlots.fulfilled, (state, action) => {
        state.slots = action.payload;
      })
      .addCase(saveGame.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveGame.fulfilled, (state, action) => {
        state.isSaving = false;
        state.lastSaveTime = action.payload.timestamp;
        state.currentSlot = action.payload.slotIndex;
      })
      .addCase(saveGame.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.error.message || 'Failed to save';
      })
      .addCase(loadGame.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadGame.fulfilled, (state, action) => {
        state.isLoading = false;
        // State restoration handled by listener
      })
      .addCase(loadGame.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load';
      });
  },
});
```

---

# ⚡ PERFORMANCE OPTIMIZATION

## Optimization Strategies

### 1. Entity Pooling

```typescript
// src/engine/rendering/SpritePool.ts
import * as PIXI from 'pixi.js';

export class SpritePool<T extends PIXI.Sprite> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  
  constructor(factory: () => T, initialSize: number = 100) {
    this.factory = factory;
    
    // Pre-allocate sprites
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }
  
  acquire(): T {
    let sprite = this.pool.pop();
    
    if (!sprite) {
      sprite = this.factory();
    }
    
    sprite.visible = true;
    this.active.add(sprite);
    return sprite;
  }
  
  release(sprite: T): void {
    if (!this.active.has(sprite)) return;
    
    sprite.visible = false;
    sprite.removeFromParent();
    this.active.delete(sprite);
    this.pool.push(sprite);
  }
  
  releaseAll(): void {
    for (const sprite of this.active) {
      sprite.visible = false;
      sprite.removeFromParent();
      this.pool.push(sprite);
    }
    this.active.clear();
  }
}
```

### 2. Viewport Culling

```typescript
// src/engine/rendering/ViewportCuller.ts
import { screenToGrid, gridToScreen, TILE_WIDTH, TILE_HEIGHT } from '@/utils/math/isometric';

export class ViewportCuller {
  getVisibleGridBounds(
    camera: CameraState,
    screenWidth: number,
    screenHeight: number
  ): GridBounds {
    // Add padding for sprites that extend beyond their tile
    const padding = 2;
    
    // Convert screen corners to grid coordinates
    const topLeft = screenToGrid({
      x: camera.x - screenWidth / 2 / camera.zoom,
      y: camera.y - screenHeight / 2 / camera.zoom,
    });
    
    const bottomRight = screenToGrid({
      x: camera.x + screenWidth / 2 / camera.zoom,
      y: camera.y + screenHeight / 2 / camera.zoom,
    });
    
    return {
      minX: topLeft.x - padding,
      minY: topLeft.y - padding,
      maxX: bottomRight.x + padding,
      maxY: bottomRight.y + padding,
    };
  }
  
  isEntityVisible(position: GridPosition, bounds: GridBounds): boolean {
    return (
      position.x >= bounds.minX &&
      position.x <= bounds.maxX &&
      position.y >= bounds.minY &&
      position.y <= bounds.maxY
    );
  }
}
```

### 3. Memoized Selectors

```typescript
// src/features/facilities/facilitiesSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

// Base selector
const selectFacilitiesState = (state: RootState) => state.facilities;

// Memoized: Get all facilities as array
export const selectAllFacilities = createSelector(
  [selectFacilitiesState],
  (facilities) => Object.values(facilities.entities)
);

// Memoized: Get facilities by category
export const selectFacilitiesByCategory = createSelector(
  [selectAllFacilities, (_, category: FacilityCategory) => category],
  (facilities, category) => 
    facilities.filter(f => FACILITY_DEFINITIONS[f.definitionId].category === category)
);

// Memoized: Get operating facilities
export const selectOperatingFacilities = createSelector(
  [selectAllFacilities],
  (facilities) => facilities.filter(f => f.isOperating)
);

// Memoized: Calculate total daily maintenance cost
export const selectTotalMaintenanceCost = createSelector(
  [selectAllFacilities],
  (facilities) => 
    facilities.reduce((total, f) => {
      const definition = FACILITY_DEFINITIONS[f.definitionId];
      return total + definition.maintenanceCost;
    }, 0)
);

// Memoized: Get facilities at grid position
export const selectFacilityAtPosition = createSelector(
  [selectAllFacilities, (_, position: GridPosition) => position],
  (facilities, position) =>
    facilities.find(f => 
      f.gridPosition.x === position.x && 
      f.gridPosition.y === position.y
    )
);
```

### 4. Batch State Updates

```typescript
// src/features/tourists/touristsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const touristsSlice = createSlice({
  name: 'tourists',
  initialState,
  reducers: {
    // Batch update for performance - update many tourists at once
    batchUpdatePositions: (
      state,
      action: PayloadAction<Array<{ id: string; position: Vector2 }>>
    ) => {
      for (const update of action.payload) {
        const tourist = state.entities[update.id];
        if (tourist) {
          tourist.position = update.position;
        }
      }
    },
    
    // Batch update needs
    batchUpdateNeeds: (
      state,
      action: PayloadAction<Array<{ id: string; needs: Partial<TouristNeeds> }>>
    ) => {
      for (const update of action.payload) {
        const tourist = state.entities[update.id];
        if (tourist) {
          tourist.needs = { ...tourist.needs, ...update.needs };
        }
      }
    },
  },
});
```

## Performance Monitoring

```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private readonly maxSamples = 60;
  
  recordFrame(deltaTime: number): void {
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }
  
  getAverageFPS(): number {
    if (this.frameTimes.length === 0) return 0;
    
    const avgDelta = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
    return 1000 / avgDelta;
  }
  
  getMetrics(): PerformanceMetrics {
    return {
      fps: this.getAverageFPS(),
      memory: (performance as any).memory?.usedJSHeapSize || 0,
      entityCount: this.getEntityCount(),
    };
  }
}
```

---

# 🧪 TESTING STRATEGY

## Test Structure

```
tests/
├── unit/
│   ├── slices/
│   │   ├── economySlice.test.ts
│   │   ├── timeSlice.test.ts
│   │   └── facilitiesSlice.test.ts
│   ├── engine/
│   │   ├── GameClock.test.ts
│   │   ├── isometric.test.ts
│   │   └── TouristAI.test.ts
│   └── utils/
│       ├── formatters.test.ts
│       └── random.test.ts
│
├── integration/
│   ├── gameLoop.test.ts
│   ├── economyFlow.test.ts
│   └── saveLoad.test.ts
│
└── mocks/
    ├── store.ts
    └── pixi.ts
```

## Example Unit Tests

```typescript
// tests/unit/slices/economySlice.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import economyReducer, { economyActions } from '@/features/economy/economySlice';
import type { EconomyState } from '@/features/economy/types';

describe('economySlice', () => {
  let initialState: EconomyState;
  
  beforeEach(() => {
    initialState = {
      balance: 50000,
      prestigePoints: 0,
      vipTokens: 0,
      transactions: [],
      dailyRevenue: 0,
      dailyExpenses: 0,
      statistics: {
        totalEarned: 0,
        totalSpent: 0,
        peakBalance: 50000,
      },
    };
  });
  
  describe('addFunds', () => {
    it('should add funds to balance', () => {
      const action = economyActions.addFunds({
        amount: 1000,
        source: 'facility_revenue',
        description: 'Ice cream sales',
      });
      
      const state = economyReducer(initialState, action);
      
      expect(state.balance).toBe(51000);
      expect(state.dailyRevenue).toBe(1000);
      expect(state.statistics.totalEarned).toBe(1000);
    });
    
    it('should update peak balance when exceeded', () => {
      const action = economyActions.addFunds({
        amount: 10000,
        source: 'facility_revenue',
      });
      
      const state = economyReducer(initialState, action);
      
      expect(state.statistics.peakBalance).toBe(60000);
    });
    
    it('should add transaction record', () => {
      const action = economyActions.addFunds({
        amount: 500,
        source: 'facility_revenue',
        description: 'Test',
      });
      
      const state = economyReducer(initialState, action);
      
      expect(state.transactions).toHaveLength(1);
      expect(state.transactions[0].type).toBe('income');
      expect(state.transactions[0].amount).toBe(500);
    });
  });
  
  describe('deductFunds', () => {
    it('should deduct funds from balance', () => {
      const action = economyActions.deductFunds({
        amount: 5000,
        category: 'construction',
      });
      
      const state = economyReducer(initialState, action);
      
      expect(state.balance).toBe(45000);
      expect(state.dailyExpenses).toBe(5000);
    });
  });
});
```

```typescript
// tests/unit/engine/isometric.test.ts
import { describe, it, expect } from 'vitest';
import {
  gridToScreen,
  screenToGrid,
  getDepth,
  TILE_WIDTH,
  TILE_HEIGHT,
} from '@/utils/math/isometric';

describe('isometric utilities', () => {
  describe('gridToScreen', () => {
    it('should convert origin correctly', () => {
      const result = gridToScreen({ x: 0, y: 0 });
      expect(result).toEqual({ x: 0, y: 0 });
    });
    
    it('should convert positive coordinates', () => {
      const result = gridToScreen({ x: 5, y: 3 });
      expect(result.x).toBe((5 - 3) * (TILE_WIDTH / 2)); // 64
      expect(result.y).toBe((5 + 3) * (TILE_HEIGHT / 2)); // 128
    });
  });
  
  describe('screenToGrid', () => {
    it('should be inverse of gridToScreen', () => {
      const original = { x: 10, y: 5 };
      const screen = gridToScreen(original);
      const result = screenToGrid(screen);
      
      expect(result.x).toBe(original.x);
      expect(result.y).toBe(original.y);
    });
  });
  
  describe('getDepth', () => {
    it('should return higher depth for tiles further back', () => {
      const front = getDepth({ x: 0, y: 0 });
      const back = getDepth({ x: 5, y: 5 });
      
      expect(back).toBeGreaterThan(front);
    });
  });
});
```

---

# 🌐 FUTURE BACKEND INTEGRATION

## Phase 2 Architecture Preview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 2: ONLINE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐       │
│  │   BROWSER    │◀───────▶│   GO API     │◀───────▶│  POSTGRESQL  │       │
│  │   (React)    │  REST   │   SERVER     │   SQL   │   DATABASE   │       │
│  └──────────────┘         └──────────────┘         └──────────────┘       │
│         │                        │                                         │
│         │                        │                                         │
│         ▼                        ▼                                         │
│  ┌──────────────┐         ┌──────────────┐                                │
│  │   IndexedDB  │         │    REDIS     │                                │
│  │   (Offline)  │         │   (Cache)    │                                │
│  └──────────────┘         └──────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Go Backend Structure (Preview)

```
backend/
├── cmd/
│   └── server/
│       └── main.go
│
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── auth.go
│   │   │   ├── saves.go
│   │   │   └── leaderboard.go
│   │   ├── middleware/
│   │   │   ├── auth.go
│   │   │   └── cors.go
│   │   └── routes.go
│   │
│   ├── domain/
│   │   ├── user.go
│   │   ├── save.go
│   │   └── achievement.go
│   │
│   ├── repository/
│   │   ├── postgres/
│   │   │   ├── user_repo.go
│   │   │   └── save_repo.go
│   │   └── interfaces.go
│   │
│   └── service/
│       ├── auth_service.go
│       └── save_service.go
│
├── pkg/
│   └── validator/
│
├── migrations/
│   └── 001_initial.sql
│
├── go.mod
└── go.sum
```

## API Endpoints (Preview)

```
POST   /api/v1/auth/register      # Create account
POST   /api/v1/auth/login         # Login
POST   /api/v1/auth/refresh       # Refresh token

GET    /api/v1/saves              # List user saves
GET    /api/v1/saves/:id          # Get specific save
POST   /api/v1/saves              # Create new save
PUT    /api/v1/saves/:id          # Update save
DELETE /api/v1/saves/:id          # Delete save
POST   /api/v1/saves/:id/sync     # Sync local save to cloud

GET    /api/v1/leaderboard        # Get global rankings
GET    /api/v1/achievements       # Get user achievements
```

## Frontend API Client (Preview)

```typescript
// src/api/client.ts (Future implementation)
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Saves
    getSaves: builder.query<SaveMeta[], void>({
      query: () => '/saves',
    }),
    syncSave: builder.mutation<void, { id: string; data: SaveData }>({
      query: ({ id, data }) => ({
        url: `/saves/${id}/sync`,
        method: 'POST',
        body: data,
      }),
    }),
    
    // Leaderboard
    getLeaderboard: builder.query<LeaderboardEntry[], void>({
      query: () => '/leaderboard',
    }),
  }),
});
```

---

# 📅 IMPLEMENTATION PHASES

## Phase 1: MVP (8 weeks)

| Week | Milestone | Deliverables |
|------|-----------|--------------|
| 1-2 | Project Setup | Vite, React, Redux, PixiJS integration |
| 3-4 | Core Systems | Time, weather, basic economy |
| 5-6 | Facilities | Building, placement, basic simulation |
| 7-8 | Tourists | Spawning, pathfinding, basic AI |

## Phase 2: Core Features (8 weeks)

| Week | Milestone | Deliverables |
|------|-----------|--------------|
| 9-10 | UI Polish | shadcn panels, notifications, menus |
| 11-12 | Staff System | Hiring, assignment, wages |
| 13-14 | Save/Load | IndexedDB persistence |
| 15-16 | Audio | Howler.js integration, music system |

## Phase 3: Advanced Features (8 weeks)

| Week | Milestone | Deliverables |
|------|-----------|--------------|
| 17-18 | VIP System | VIP generation, villas, relationships |
| 19-20 | Events | Calendar, special events, effects |
| 21-22 | Achievements | Tracking, unlocks, rewards |
| 23-24 | Campaign | Tutorial, chapters, objectives |

## Phase 4: Polish & Backend (Ongoing)

- Performance optimization
- Bug fixes
- Go backend development
- Cloud saves
- Leaderboards

---

*Technical Design Document v1.0*
*Beach Alley Development Team*
*February 2026*

```
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║   🛠️  BEACH ALLEY - TECHNICAL FOUNDATIONS  🛠️    ║
    ║                                                   ║
    ║        Building Dreams, One Tile at a Time        ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
```
