/**
 * A* Pathfinding Implementation
 * Finds optimal paths through the grid
 */

import { Vector2 } from '../types';
import { Tile } from '../types/tiles';

interface PathNode {
  tile: Tile;
  g: number;  // Cost from start
  h: number;  // Heuristic to goal
  f: number;  // Total cost (g + h)
  parent: PathNode | null;
}

export class Pathfinder {
  /**
   * Find path using A* algorithm
   */
  findPath(
    start: Vector2,
    goal: Vector2,
    grid: Tile[][],
    getNeighbors: (x: number, y: number) => Tile[]
  ): Vector2[] | null {
    // Handle fractional coordinates by flooring them to get tile indices
    const startX = Math.floor(start.x);
    const startY = Math.floor(start.y);
    const goalX = Math.floor(goal.x);
    const goalY = Math.floor(goal.y);

    // Validate start and goal
    if (!grid[startY]?.[startX] || !grid[goalY]?.[goalX]) {
      return null;
    }

    const startTile = grid[startY][startX];
    const goalTile = grid[goalY][goalX];

    if (!startTile || !goalTile.walkable) {
      return null;
    }

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const nodeMap = new Map<string, PathNode>();

    // Create start node
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
      // Get node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      // Reached goal?
      if (current.tile.gridX === goalX && current.tile.gridY === goalY) {
        return this.reconstructPath(current);
      }

      closedSet.add(this.tileKey(current.tile));

      // Check neighbors
      const neighbors = getNeighbors(current.tile.gridX, current.tile.gridY);

      for (const neighborTile of neighbors) {
        const neighborKey = this.tileKey(neighborTile);

        if (closedSet.has(neighborKey)) {
          continue;
        }

        const tentativeG = current.g + neighborTile.movementCost;

        let neighborNode = nodeMap.get(neighborKey);

        if (!neighborNode) {
          // New node
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
          // Better path found
          neighborNode.parent = current;
          neighborNode.g = tentativeG;
          neighborNode.f = neighborNode.g + neighborNode.h;

          if (!openSet.includes(neighborNode)) {
            openSet.push(neighborNode);
          }
        }
      }
    }

    // No path found
    return null;
  }

  /**
   * Manhattan distance heuristic (grid-friendly)
   */
  private heuristic(a: Tile, b: Tile): number {
    return Math.abs(a.gridX - b.gridX) + Math.abs(a.gridY - b.gridY);
  }

  /**
   * Reconstruct path from goal to start
   * Returns waypoints at tile centers for smooth movement
   */
  private reconstructPath(goalNode: PathNode): Vector2[] {
    const path: Vector2[] = [];
    let current: PathNode | null = goalNode;

    while (current) {
      // Always use tile center for waypoints
      path.unshift({
        x: current.tile.gridX + 0.5,
        y: current.tile.gridY + 0.5,
      });
      current = current.parent;
    }

    return path;
  }

  /**
   * Create unique key for tile
   */
  private tileKey(tile: Tile): string {
    return `${tile.gridX},${tile.gridY}`;
  }

  /**
   * Simplify path by removing redundant waypoints
   * Keeps only waypoints where direction changes (corners)
   */
  simplifyPath(path: Vector2[]): Vector2[] {
    if (path.length <= 2) return path;

    const simplified: Vector2[] = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];

      // Calculate direction vectors
      const dx1 = Math.sign(curr.x - prev.x);
      const dy1 = Math.sign(curr.y - prev.y);
      const dx2 = Math.sign(next.x - curr.x);
      const dy2 = Math.sign(next.y - curr.y);

      // Keep waypoint if direction changes (this is a corner)
      if (dx1 !== dx2 || dy1 !== dy2) {
        simplified.push(curr);
      }
    }

    simplified.push(path[path.length - 1]);

    return simplified;
  }

  /**
   * Smooth path - REMOVED
   * Path should already be tile-by-tile through centers with 4-directional movement
   * No smoothing needed, it was creating diagonal interpolation!
   */
  smoothPath(path: Vector2[]): Vector2[] {
    // Just return the simplified path - each waypoint is already at a tile center
    // With 4-directional movement, the path naturally goes through centers
    return path;
  }
}
