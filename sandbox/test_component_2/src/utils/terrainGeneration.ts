// Helper functions for terrain generation

import { TileCoordinate, Point2D } from '../types/environment';

export function tileKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function calculateDistance(tile: TileCoordinate, point: Point2D): number {
  const dx = tile.col - point.x;
  const dy = tile.row - point.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateDistanceToPoint(
  row: number,
  col: number,
  centerRow: number,
  centerCol: number
): number {
  const dx = col - centerCol;
  const dy = row - centerRow;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isInsideCircle(
  tile: TileCoordinate,
  center: Point2D,
  radius: number
): boolean {
  return calculateDistance(tile, center) <= radius;
}

export function getNearestEdgeDistance(
  row: number,
  col: number,
  mapRows: number,
  mapCols: number
): number {
  const distToTop = row;
  const distToBottom = mapRows - 1 - row;
  const distToLeft = col;
  const distToRight = mapCols - 1 - col;
  return Math.min(distToTop, distToBottom, distToLeft, distToRight);
}

export function getDistanceFromBottomLeft(
  row: number,
  col: number,
  mapRows: number
): number {
  const bottomRow = mapRows - 1;
  const leftCol = 0;
  const distanceFromEdge = Math.min(bottomRow - row, col);
  return distanceFromEdge;
}

export function perpendicularDistanceToLine(
  row: number,
  col: number,
  lineStart: Point2D,
  lineEnd: Point2D
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return calculateDistance({ row, col }, lineStart);
  }
  const t = Math.max(0, Math.min(1,
    ((col - lineStart.x) * dx + (row - lineStart.y) * dy) / lengthSquared
  ));
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  return calculateDistance({ row, col }, { x: projX, y: projY });
}

export function isPointInCrescent(
  row: number,
  col: number,
  center: Point2D,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): boolean {
  const dx = col - center.x;
  const dy = row - center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > outerRadius || distance < innerRadius) return false;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  if (startAngle <= endAngle) {
    return angle >= startAngle && angle <= endAngle;
  }
  return angle >= startAngle || angle <= endAngle;
}

export class SimplexNoise {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  noise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  }
}
