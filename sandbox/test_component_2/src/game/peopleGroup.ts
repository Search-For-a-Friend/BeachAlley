import { PeopleGroup, Vector2, GameConfig, GroupType } from '../types';
import { randomInt, generateId } from './utils';

export const GROUP_CONFIGS: Record<GroupType, { minSize: number; maxSize: number; color: string }> = {
  solo: { minSize: 1, maxSize: 1, color: '#ff6b9d' },
  couple: { minSize: 2, maxSize: 2, color: '#4ecdc4' },
  family: { minSize: 3, maxSize: 5, color: '#ffe66d' },
  friends: { minSize: 3, maxSize: 6, color: '#a8dadc' },
};

const randomPick = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

export function createPeopleGroup(spawnPosition: Vector2, config: GameConfig): PeopleGroup {
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
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    group.facingDirection = dx > 0 ? 'right' : 'left';
  } else {
    group.facingDirection = dy > 0 ? 'down' : 'up';
  }
}
