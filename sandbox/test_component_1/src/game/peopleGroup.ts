import { PeopleGroup, Vector2, GameConfig, GroupType } from '../types';
import { randomBetween, randomInt, generateId } from './utils';

// Group type configurations
export const GROUP_CONFIGS: Record<GroupType, { minSize: number; maxSize: number; color: string }> = {
  solo: { minSize: 1, maxSize: 1, color: '#ff6b9d' },
  couple: { minSize: 2, maxSize: 2, color: '#4ecdc4' },
  family: { minSize: 3, maxSize: 5, color: '#ffe66d' },
  friends: { minSize: 3, maxSize: 6, color: '#a8dadc' },
};

const randomPick = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

export function createPeopleGroup(
  spawnPosition: Vector2,
  config: GameConfig
): PeopleGroup {
  const type = randomPick<GroupType>(['solo', 'couple', 'family', 'friends']);
  const groupConfig = GROUP_CONFIGS[type];
  const size = randomInt(groupConfig.minSize, groupConfig.maxSize);
  
  return {
    id: generateId(),
    size,
    type,
    position: { ...spawnPosition },
    previousPosition: { ...spawnPosition },
    targetPosition: null,
    speed: config.groupSpeed,  // Constant speed in grid units per second - visual speed varies due to isometric projection
    facingDirection: 'down' as const,
    path: null,  // Pathfinding waypoints
    currentWaypoint: 0,  // Current waypoint index
    state: 'spawning',
    currentEstablishment: null,
    desire: randomBetween(60, 100),
    patience: randomBetween(70, 100),
    satisfaction: 100,
    money: randomBetween(50, 150),
    spawnTime: 0, // Will be set by engine using game time
    timeInEstablishment: 0,
    color: groupConfig.color,
  };
}

/**
 * Get a random spawn tile to exit through
 * Groups must leave via spawn tiles
 */
export function getExitSpawnTile(): Vector2 {
  const spawnTileCoords = [5, 10, 15];
  return {
    x: spawnTileCoords[Math.floor(Math.random() * spawnTileCoords.length)] + 0.5,
    y: spawnTileCoords[Math.floor(Math.random() * spawnTileCoords.length)] + 0.5,
  };
}

export function setGroupState(group: PeopleGroup, newState: PeopleGroup['state']): void {
  group.state = newState;
}

export function isOutOfBounds(
  group: PeopleGroup,
  gridWidth: number = 20,
  gridHeight: number = 20
): boolean {
  const margin = 2; // Groups are out of bounds if beyond margin from edge (for cleanup)
  return (
    group.position.x < -margin ||
    group.position.x > gridWidth + margin ||
    group.position.y < -margin ||
    group.position.y > gridHeight + margin
  );
}

/**
 * Update group's facing direction based on movement
 */
export function updateGroupFacing(group: PeopleGroup): void {
  const dx = group.position.x - group.previousPosition.x;
  const dy = group.position.y - group.previousPosition.y;
  
  // Only update if there's significant movement
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;
  
  // Determine primary direction
  if (Math.abs(dx) > Math.abs(dy)) {
    group.facingDirection = dx > 0 ? 'right' : 'left';
  } else {
    group.facingDirection = dy > 0 ? 'down' : 'up';
  }
}

/**
 * Get emoji representation for group type
 */
export function getGroupEmoji(type: GroupType): string {
  const emojiMap: Record<GroupType, string> = {
    solo: '🚶',
    couple: '👫',
    family: '👨‍👩‍👧‍👦',
    friends: '👥',
  };
  return emojiMap[type];
}

/**
 * Get human-readable description of group state
 */
export function getStateDescription(state: PeopleGroup['state']): string {
  const stateDescriptions: Record<PeopleGroup['state'], string> = {
    spawning: 'Just arrived',
    idle: 'Looking around',
    seeking: 'Heading somewhere',
    wandering: 'Wandering',
    queuing: 'In queue',
    entering: 'Entering',
    visiting: 'Inside',
    leaving: 'Leaving',
    despawned: 'Left',
  };
  return stateDescriptions[state] || state;
}
