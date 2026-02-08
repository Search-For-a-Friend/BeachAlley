// Game types (from test_component_1)

export interface Vector2 {
  x: number;
  y: number;
}

export type EstablishmentState = 'closed' | 'deserted' | 'visited' | 'busy' | 'crowded';

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

export type GameEvent =
  | { type: 'GROUP_SPAWNED'; group: PeopleGroup }
  | { type: 'GROUP_ENTERED'; groupId: string; establishmentId: string }
  | { type: 'GROUP_LEFT'; groupId: string; establishmentId: string; reason: string }
  | { type: 'GROUP_DESPAWNED'; groupId: string }
  | { type: 'STATE_CHANGED'; establishmentId: string; from: EstablishmentState; to: EstablishmentState };
