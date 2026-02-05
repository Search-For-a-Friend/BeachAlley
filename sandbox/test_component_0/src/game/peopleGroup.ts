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
    speed: config.groupSpeed,  // Constant speed in grid units per second - visual speed varies due to isometric projection
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
 * Get exit position (edge of world)
 */
export function getExitPosition(
  currentPosition: Vector2,
  gridSize: number = 20
): Vector2 {
  // Exit towards nearest edge, but with some margin to ensure visibility
  const margin = 1;
  
  // Determine which edge is nearest and exit there (in grid coordinates)
  const distToTop = currentPosition.y;
  const distToBottom = gridSize - currentPosition.y;
  const distToLeft = currentPosition.x;
  const distToRight = gridSize - currentPosition.x;
  
  const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
  
  if (minDist === distToTop) {
    return { x: currentPosition.x, y: 2 };  // Exit near top edge but visible
  } else if (minDist === distToBottom) {
    return { x: currentPosition.x, y: gridSize - 2 };  // Exit near bottom edge
  } else if (minDist === distToLeft) {
    return { x: 2, y: currentPosition.y };  // Exit near left edge
  } else {
    return { x: gridSize - 2, y: currentPosition.y };  // Exit near right edge
  }
}

/**
 * Update group state
 */
export function setGroupState(group: PeopleGroup, newState: GroupState): void {
  group.state = newState;
}

/**
 * Check if group has left the world bounds
 */
export function isOutOfBounds(
  group: PeopleGroup,
  gridSize: number = 20
): boolean {
  const margin = 1;  // Groups are out of bounds if they reach the actual exit points
  return (
    group.position.x < margin ||
    group.position.x > gridSize - margin ||
    group.position.y < margin ||
    group.position.y > gridSize - margin
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
