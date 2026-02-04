// ============================================
// VECTOR & POSITION TYPES
// ============================================

export interface Vector2 {
  x: number;
  y: number;
}

// ============================================
// ESTABLISHMENT TYPES
// ============================================

export type EstablishmentState = 'closed' | 'deserted' | 'visited' | 'busy' | 'crowded';

export interface Establishment {
  id: string;
  position: Vector2;
  
  // Capacity
  maxCapacity: number;
  currentOccupancy: number;
  
  // State
  state: EstablishmentState;
  isOpen: boolean;
  
  // Attraction
  attractionRadius: number;
  attractionPower: number;
  
  // Timing
  serviceTime: number;
  
  // Statistics
  totalVisitors: number;
  totalRevenue: number;
}

// State thresholds
export const STATE_THRESHOLDS = {
  visited: 1,    // >= 1% occupancy
  busy: 50,      // >= 50% occupancy
  crowded: 90,   // >= 90% occupancy
} as const;

// Attraction multipliers based on state
export const STATE_ATTRACTION_MULTIPLIERS: Record<EstablishmentState, number> = {
  closed: 0,
  deserted: 1.0,
  visited: 1.2,   // Social proof bonus
  busy: 0.8,
  crowded: 0.4,
};

// ============================================
// PEOPLE GROUP TYPES
// ============================================

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
  
  // Composition
  size: number;
  type: GroupType;
  
  // Position & Movement
  position: Vector2;
  previousPosition: Vector2;
  targetPosition: Vector2 | null;
  speed: number;
  
  // Direction for sprite animation
  facingDirection: 'up' | 'down' | 'left' | 'right';
  
  // State
  state: GroupState;
  currentEstablishment: string | null;
  
  // Needs & Desires
  desire: number;
  patience: number;
  satisfaction: number;
  money: number;
  
  // Timers
  spawnTime: number;
  timeInEstablishment: number;
  
  // Visual
  color: string;
}

// Group type configurations
export const GROUP_CONFIGS: Record<GroupType, { minSize: number; maxSize: number; color: string }> = {
  solo: { minSize: 1, maxSize: 1, color: '#00ffff' },
  couple: { minSize: 2, maxSize: 2, color: '#ff6b9d' },
  family: { minSize: 3, maxSize: 5, color: '#ffd93d' },
  friends: { minSize: 3, maxSize: 6, color: '#6bcb77' },
};

// ============================================
// GAME STATE
// ============================================

export interface GameState {
  establishments: Establishment[];
  groups: PeopleGroup[];
  time: number;
  isPaused: boolean;
  stats: GameStats;
}

export interface GameStats {
  totalGroupsSpawned: number;
  totalGroupsDespawned: number;
  totalVisits: number;
  totalRevenue: number;
}

// ============================================
// CONFIGURATION
// ============================================

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
  spawnInterval: 2000,
  spawnProbability: 0.6,
  maxGroups: 15,
  groupSpeed: 80,
  defaultServiceTime: 8000,
  satisfactionDecayRate: 2,
  moneyPerSecond: 5,
};

// ============================================
// EVENTS
// ============================================

export type GameEvent = 
  | { type: 'GROUP_SPAWNED'; group: PeopleGroup }
  | { type: 'GROUP_ENTERED'; groupId: string; establishmentId: string }
  | { type: 'GROUP_LEFT'; groupId: string; establishmentId: string; reason: string }
  | { type: 'GROUP_DESPAWNED'; groupId: string }
  | { type: 'STATE_CHANGED'; establishmentId: string; from: EstablishmentState; to: EstablishmentState };
