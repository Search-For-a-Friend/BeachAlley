import { Vector2 } from '../types';

/**
 * Calculate distance between two points
 */
export function distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a vector
 */
export function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Move towards a target position
 */
export function moveTowards(
  current: Vector2,
  target: Vector2,
  speed: number,
  deltaTime: number
): Vector2 {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist <= speed * deltaTime) {
    return { ...target };
  }
  
  // GRID-ALIGNED MOVEMENT: Move along axes only (no diagonal shortcuts!)
  // This makes groups follow the path tiles exactly through centers
  const moveDistance = speed * deltaTime;
  
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  // Move along whichever axis has more distance to cover
  if (absDx > absDy) {
    // Move horizontally (along X axis)
    const stepX = Math.sign(dx) * Math.min(moveDistance, absDx);
    return {
      x: current.x + stepX,
      y: current.y,  // Keep Y constant - move horizontally only
    };
  } else {
    // Move vertically (along Y axis)
    const stepY = Math.sign(dy) * Math.min(moveDistance, absDy);
    return {
      x: current.x,  // Keep X constant - move vertically only
      y: current.y + stepY,
    };
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Random number between min and max
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random element from an array
 */
export function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
