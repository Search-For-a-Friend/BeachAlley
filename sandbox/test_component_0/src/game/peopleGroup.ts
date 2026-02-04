import {
  PeopleGroup,
  GroupType,
  GroupState,
  GROUP_CONFIGS,
  Vector2,
  GameConfig,
} from '../types';
import { generateId, randomInt, randomPick, randomBetween } from './utils';

/**
 * Create a new people group
 */
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
    speed: config.groupSpeed + randomBetween(-10, 10),
    facingDirection: 'down' as const,
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
 * Get random spawn position at the edge of the canvas
 */
export function getSpawnPosition(canvasWidth: number, canvasHeight: number): Vector2 {
  const edge = randomInt(0, 3);
  const margin = 20;
  
  switch (edge) {
    case 0: // Top
      return { x: randomBetween(margin, canvasWidth - margin), y: -margin };
    case 1: // Right
      return { x: canvasWidth + margin, y: randomBetween(margin, canvasHeight - margin) };
    case 2: // Bottom
      return { x: randomBetween(margin, canvasWidth - margin), y: canvasHeight + margin };
    case 3: // Left
    default:
      return { x: -margin, y: randomBetween(margin, canvasHeight - margin) };
  }
}

/**
 * Get exit position (opposite edge from spawn)
 */
export function getExitPosition(
  currentPosition: Vector2,
  canvasWidth: number,
  canvasHeight: number
): Vector2 {
  const margin = 50;
  
  // Determine which edge is furthest and exit there
  const distToTop = currentPosition.y;
  const distToBottom = canvasHeight - currentPosition.y;
  const distToLeft = currentPosition.x;
  const distToRight = canvasWidth - currentPosition.x;
  
  const maxDist = Math.max(distToTop, distToBottom, distToLeft, distToRight);
  
  if (maxDist === distToTop) {
    return { x: currentPosition.x, y: -margin };
  } else if (maxDist === distToBottom) {
    return { x: currentPosition.x, y: canvasHeight + margin };
  } else if (maxDist === distToLeft) {
    return { x: -margin, y: currentPosition.y };
  } else {
    return { x: canvasWidth + margin, y: currentPosition.y };
  }
}

/**
 * Update group state
 */
export function setGroupState(group: PeopleGroup, newState: GroupState): void {
  group.state = newState;
}

/**
 * Check if group has left the canvas
 */
export function isOutOfBounds(
  group: PeopleGroup,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const margin = 100;
  return (
    group.position.x < -margin ||
    group.position.x > canvasWidth + margin ||
    group.position.y < -margin ||
    group.position.y > canvasHeight + margin
  );
}

/**
 * Get group type emoji
 */
export function getGroupEmoji(type: GroupType): string {
  const emojis: Record<GroupType, string> = {
    solo: '🚶',
    couple: '💑',
    family: '👨‍👩‍👧',
    friends: '👥',
  };
  return emojis[type];
}

/**
 * Get state description
 */
export function getStateDescription(state: GroupState): string {
  const descriptions: Record<GroupState, string> = {
    spawning: 'Appearing...',
    idle: 'Looking around',
    seeking: 'Heading to destination',
    wandering: 'Wandering',
    queuing: 'Waiting in line',
    entering: 'Entering',
    visiting: 'Inside',
    leaving: 'Leaving',
    despawned: 'Gone',
  };
  return descriptions[state];
}

/**
 * Calculate facing direction from movement delta
 */
export function calculateFacingDirection(
  dx: number,
  dy: number
): 'up' | 'down' | 'left' | 'right' {
  // Only update if there's significant movement
  const threshold = 0.5;
  
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
    // No significant movement, keep current direction
    return 'down'; // Default
  }
  
  // Determine primary direction
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal movement is dominant
    return dx > 0 ? 'right' : 'left';
  } else {
    // Vertical movement is dominant
    return dy > 0 ? 'down' : 'up';
  }
}

/**
 * Update group's facing direction based on movement
 */
export function updateGroupFacing(group: PeopleGroup): void {
  const dx = group.position.x - group.previousPosition.x;
  const dy = group.position.y - group.previousPosition.y;
  
  // Only update if there's actual movement
  if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
    group.facingDirection = calculateFacingDirection(dx, dy);
  }
  
  // Update previous position for next frame
  group.previousPosition = { ...group.position };
}
