import { PeopleGroup, Vector2, GameConfig, GroupType } from '../types';
import { randomInt, generateId } from './utils';

export const GROUP_CONFIGS: Record<GroupType, { minSize: number; maxSize: number; color: string }> = {
  single_group: { minSize: 1, maxSize: 1, color: '#ff6b9d' },
  small_group: { minSize: 2, maxSize: 3, color: '#4ecdc4' },
  big_group: { minSize: 4, maxSize: 6, color: '#ffe66d' },
};

const randomPick = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

export function createPeopleGroup(spawnPosition: Vector2, config: GameConfig): PeopleGroup {
  const type = randomPick<GroupType>(['single_group', 'small_group', 'big_group']);
  const groupConfig = GROUP_CONFIGS[type];
  const size = randomInt(groupConfig.minSize, groupConfig.maxSize);
  return {
    id: generateId(),
    size,
    type,
    position: { ...spawnPosition },
    previousPosition: { ...spawnPosition },
    targetPosition: null,
    speed: config.groupSpeed,
    facingDirection: 'down',
    path: null,
    currentWaypoint: 0,
    state: 'spawning',
    currentEstablishment: null,
    desire: (Math.random() * 40) + 60,
    patience: (Math.random() * 30) + 70,
    satisfaction: 100,
    money: (Math.random() * 100) + 50,
    spawnTime: 0,
    settledAt: null,
    timeInEstablishment: 0,
    color: groupConfig.color,
  };
}

export function setGroupState(group: PeopleGroup, newState: PeopleGroup['state']): void {
  group.state = newState;
}

export function isOutOfBounds(
  group: PeopleGroup,
  gridWidth: number,
  gridHeight: number
): boolean {
  const margin = 2;
  return (
    group.position.x < -margin ||
    group.position.x > gridWidth + margin ||
    group.position.y < -margin ||
    group.position.y > gridHeight + margin
  );
}

export function updateGroupFacing(group: PeopleGroup): void {
  const dx = group.position.x - group.previousPosition.x;
  const dy = group.position.y - group.previousPosition.y;
  
  // Only update facing if there's significant movement (prevent shaky behavior)
  const movementThreshold = 0.5;
  if (Math.abs(dx) < movementThreshold && Math.abs(dy) < movementThreshold) return;
  
  // Update facing based on primary movement direction
  if (Math.abs(dx) > Math.abs(dy)) {
    group.facingDirection = dx > 0 ? 'right' : 'left';
  } else {
    group.facingDirection = dy > 0 ? 'down' : 'up';
  }
}
