// Simplified Game types - only tiles and groups

export interface Vector2 {
  x: number;
  y: number;
}

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
  | { type: 'GROUP_DESPAWNED'; groupId: string }
  | { type: 'GAME_OVER'; won: boolean; reason: string };

export type EventCallback = (event: GameEvent) => void;
