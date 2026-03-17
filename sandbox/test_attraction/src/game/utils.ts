import { Vector2 } from '../types';

export function distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function moveTowards(
  current: Vector2,
  target: Vector2,
  speed: number,
  deltaTime: number
): Vector2 {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // If we're close enough to reach the target, return target position
  if (dist <= speed * deltaTime) return { ...target };
  
  // Calculate normalized direction vector for smooth diagonal movement
  const moveDistance = speed * deltaTime;
  const normalizedDx = dx / dist;
  const normalizedDy = dy / dist;
  
  // Move in both X and Y directions proportionally
  const newX = current.x + normalizedDx * moveDistance;
  const newY = current.y + normalizedDy * moveDistance;
  
  return { x: newX, y: newY };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
