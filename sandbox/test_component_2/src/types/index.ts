// Game types (from test_component_1)

export interface Vector2 {
  x: number;
  y: number;
}

export type EstablishmentState = 'closed' | 'deserted' | 'visited' | 'busy' | 'crowded';

export interface Staff {
  id: string;
  name: string;
  occupation: string;
  establishmentId: string;
  dailyCost: number;
  efficiency: number; // 0.5 to 1.5 multiplier
}

export interface Establishment {
  id: string;
  position: Vector2;
  gridPosition?: Vector2;
  entrance?: Vector2;
  maxCapacity: number;
  currentOccupancy: number;
  state: EstablishmentState;
  isOpen: boolean;
  attractionRadius: number;
  attractionPower: number;
  serviceTime: number;
  totalVisitors: number;
  totalRevenue: number;
  buildingType: string;
  staffIds: string[];
  dailyStaffCost: number;
}

export const STATE_THRESHOLDS = {
  visited: 1,
  busy: 50,
  crowded: 90,
} as const;

export const STATE_ATTRACTION_MULTIPLIERS: Record<EstablishmentState, number> = {
  closed: 0,
  deserted: 1.0,
  visited: 1.2,
  busy: 0.8,
  crowded: 0.4,
};

export type GroupType = 'solo' | 'couple' | 'family' | 'friends';

export type GroupState =
  | 'spawning'
  | 'idle'
  | 'seeking'
  | 'wandering'
  | 'queuing'
  | 'entering'
  | 'visiting'
  | 'leaving'
  | 'despawned';

export interface PeopleGroup {
  id: string;
  size: number;
  type: GroupType;
  position: Vector2;
  previousPosition: Vector2;
  targetPosition: Vector2 | null;
  speed: number;
  path: Vector2[] | null;
  currentWaypoint: number;
  facingDirection: 'up' | 'down' | 'left' | 'right';
  state: GroupState;
  currentEstablishment: string | null;
  desire: number;
  patience: number;
  satisfaction: number;
  money: number;
  spawnTime: number;
  timeInEstablishment: number;
  color: string;
}

export interface GameState {
  establishments: Establishment[];
  groups: PeopleGroup[];
  staff: Staff[];
  time: number;
  isPaused: boolean;
  stats: GameStats;
  money: number;
  totalRevenue: number;
  totalExpenses: number;
  dayCount: number;
  isGameOver: boolean;
  gameWon: boolean;
}

export interface GameStats {
  totalGroupsSpawned: number;
  totalGroupsDespawned: number;
  totalVisits: number;
  totalRevenue: number;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  spawnInterval: number;
  spawnProbability: number;
  maxGroups: number;
  groupSpeed: number;
  defaultServiceTime: number;
  satisfactionDecayRate: number;
  moneyPerSecond: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  canvasWidth: 800,
  canvasHeight: 600,
  spawnInterval: 3000,
  spawnProbability: 0.8,
  maxGroups: 15,
  groupSpeed: 1.5,
  defaultServiceTime: 8000,
  satisfactionDecayRate: 2,
  moneyPerSecond: 5,
};

export type TransactionType = 'building_purchase' | 'daily_operations' | 'customer_revenue' | 'game_start';

export interface BuildingCosts {
  buildCost: number;
  dailyCost: number;
  customerSpending: number;
  staffRequired: { occupation: string; dailyCost: number; count: number }[];
}

export const BUILDING_COSTS: Record<string, BuildingCosts> = {
  'beach bar': { 
    buildCost: 500, 
    dailyCost: 50, 
    customerSpending: 10,
    staffRequired: [
      { occupation: 'Bartender', dailyCost: 80, count: 1 }
    ]
  },
  'sun lounger': { 
    buildCost: 100, 
    dailyCost: 25, 
    customerSpending: 5,
    staffRequired: [
      { occupation: 'Attendant', dailyCost: 60, count: 1 }
    ]
  },
  'restaurant': { 
    buildCost: 1000, 
    dailyCost: 150, 
    customerSpending: 25,
    staffRequired: [
      { occupation: 'Chef', dailyCost: 120, count: 1 },
      { occupation: 'Waiter', dailyCost: 70, count: 2 }
    ]
  },
  'shop': { 
    buildCost: 2000, 
    dailyCost: 200, 
    customerSpending: 30,
    staffRequired: [
      { occupation: 'Cashier', dailyCost: 75, count: 1 },
      { occupation: 'Sales Assistant', dailyCost: 65, count: 1 }
    ]
  },
  'mall': { 
    buildCost: 5000, 
    dailyCost: 400, 
    customerSpending: 50,
    staffRequired: [
      { occupation: 'Manager', dailyCost: 150, count: 1 },
      { occupation: 'Cashier', dailyCost: 75, count: 2 },
      { occupation: 'Security Guard', dailyCost: 80, count: 1 }
    ]
  },
};

export const MONEY_THRESHOLDS = {
  STARTING_MONEY: 10000,
  LOSE_THRESHOLD: -5000,
  WIN_THRESHOLD: 50000,
} as const;

export type GameEvent =
  | { type: 'GROUP_SPAWNED'; group: PeopleGroup }
  | { type: 'GROUP_ENTERED'; groupId: string; establishmentId: string }
  | { type: 'GROUP_LEFT'; groupId: string; establishmentId: string; reason: string }
  | { type: 'GROUP_DESPAWNED'; groupId: string }
  | { type: 'STATE_CHANGED'; establishmentId: string; from: EstablishmentState; to: EstablishmentState }
  | { type: 'MONEY_CHANGED'; amount: number; transactionType: TransactionType; newBalance: number }
  | { type: 'GAME_OVER'; won: boolean; reason: string };
