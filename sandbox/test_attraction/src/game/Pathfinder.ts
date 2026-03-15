/**
 * A* Pathfinding
 */

import { Vector2 } from '../types';
import { Tile } from '../types/tiles';

interface PathNode {
  tile: Tile;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export class Pathfinder {
  findPath(
    start: Vector2,
    goal: Vector2,
    grid: Tile[][],
    getNeighbors: (x: number, y: number) => Tile[]
  ): Vector2[] | null {
    const startX = Math.floor(start.x);
    const startY = Math.floor(start.y);
    const goalX = Math.floor(goal.x);
    const goalY = Math.floor(goal.y);
    if (!grid[startY]?.[startX] || !grid[goalY]?.[goalX]) return null;
    const startTile = grid[startY][startX];
    const goalTile = grid[goalY][goalX];
    if (!startTile || !goalTile.walkable) return null;

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const nodeMap = new Map<string, PathNode>();
    const startNode: PathNode = {
      tile: startTile,
      g: 0,
      h: this.heuristic(startTile, goalTile),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);
    nodeMap.set(this.tileKey(startTile), startNode);

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      if (current.tile.gridX === goalX && current.tile.gridY === goalY) {
        return this.reconstructPath(current);
      }
      closedSet.add(this.tileKey(current.tile));
      const neighbors = getNeighbors(current.tile.gridX, current.tile.gridY);
      for (const neighborTile of neighbors) {
        const neighborKey = this.tileKey(neighborTile);
        if (closedSet.has(neighborKey)) continue;
        const tentativeG = current.g + neighborTile.movementCost;
        let neighborNode = nodeMap.get(neighborKey);
        if (!neighborNode) {
          neighborNode = {
            tile: neighborTile,
            g: Infinity,
            h: this.heuristic(neighborTile, goalTile),
            f: Infinity,
            parent: null,
          };
          nodeMap.set(neighborKey, neighborNode);
        }
        if (tentativeG < neighborNode.g) {
          neighborNode.parent = current;
          neighborNode.g = tentativeG;
          neighborNode.f = neighborNode.g + neighborNode.h;
          if (!openSet.includes(neighborNode)) openSet.push(neighborNode);
        }
      }
    }
    return null;
  }

  private heuristic(a: Tile, b: Tile): number {
    return Math.abs(a.gridX - b.gridX) + Math.abs(a.gridY - b.gridY);
  }

  private reconstructPath(goalNode: PathNode): Vector2[] {
    const path: Vector2[] = [];
    let current: PathNode | null = goalNode;
    while (current) {
      path.unshift({
        x: current.tile.gridX + 0.5,
        y: current.tile.gridY + 0.5,
      });
      current = current.parent;
    }
    return path;
  }

  private tileKey(tile: Tile): string {
    return `${tile.gridX},${tile.gridY}`;
  }

  smoothPath(path: Vector2[]): Vector2[] {
    return path;
  }
}
