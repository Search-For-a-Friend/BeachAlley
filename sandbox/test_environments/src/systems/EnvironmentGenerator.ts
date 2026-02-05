// Environment generator - procedural terrain generation for each environment type

import { EnvironmentType, TerrainMap, TerrainType, Point2D } from '../types/environment';
import { TERRAIN_CONFIG } from '../data/terrainConfig';
import { SeededRandom } from '../utils/SeededRandom';
import {
  tileKey,
  calculateDistanceToPoint,
  getNearestEdgeDistance,
  getDistanceFromBottomLeft,
  perpendicularDistanceToLine,
  isPointInCrescent,
  SimplexNoise,
} from '../utils/terrainGeneration';

export class EnvironmentGenerator {
  private mapRows: number;
  private mapCols: number;
  private random: SeededRandom;
  private noise: SimplexNoise;

  constructor(mapRows: number, mapCols: number, seed: number = TERRAIN_CONFIG.SEED) {
    this.mapRows = mapRows;
    this.mapCols = mapCols;
    this.random = new SeededRandom(seed);
    this.noise = new SimplexNoise(seed);
  }

  generate(type: EnvironmentType): TerrainMap {
    const tiles = new Map<string, TerrainType>();

    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        let terrain: TerrainType;

        switch (type) {
          case 'seafront':
            terrain = this.generateSeafrontTile(row, col);
            break;
          case 'lake':
            terrain = this.generateLakeTile(row, col);
            break;
          case 'cove':
            terrain = this.generateCoveTile(row, col);
            break;
          case 'peninsula':
            terrain = this.generatePeninsulaTile(row, col);
            break;
          case 'island':
            terrain = this.generateIslandTile(row, col);
            break;
        }

        tiles.set(tileKey(row, col), terrain);
      }
    }

    return {
      tiles,
      width: this.mapCols,
      height: this.mapRows,
    };
  }

  private generateSeafrontTile(row: number, col: number): TerrainType {
    // Bottom-left edge is ocean
    const distanceFromEdge = getDistanceFromBottomLeft(row, col, this.mapRows);
    
    // Add noise for natural variation
    const noiseValue = this.noise.noise2D(row * 0.1, col * 0.1) * TERRAIN_CONFIG.GRADIENT_NOISE_AMPLITUDE;
    const effectiveDistance = distanceFromEdge + noiseValue;

    if (effectiveDistance < TERRAIN_CONFIG.SEAFRONT_WATER_ROWS) {
      return 'water';
    }

    const sandDepth = this.random.nextInt(
      TERRAIN_CONFIG.SEAFRONT_SAND_MIN,
      TERRAIN_CONFIG.SEAFRONT_SAND_MAX
    );

    if (effectiveDistance < TERRAIN_CONFIG.SEAFRONT_WATER_ROWS + sandDepth) {
      return 'sand';
    }

    return 'grass';
  }

  private generateLakeTile(row: number, col: number): TerrainType {
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;
    const mapRadius = Math.min(this.mapRows, this.mapCols) / 2;

    // Distance from center
    const distanceFromCenter = calculateDistanceToPoint(row, col, centerRow, centerCol);
    
    // Distance from map edge
    const distanceFromEdge = getNearestEdgeDistance(row, col, this.mapRows, this.mapCols);

    // Check if inside circular map boundary
    const boundaryRadius = mapRadius * TERRAIN_CONFIG.LAKE_MAP_RADIUS_PERCENT;
    if (distanceFromCenter > boundaryRadius) {
      return 'grass'; // Outside map, default to grass
    }

    // Add noise
    const noiseValue = this.noise.noise2D(row * 0.15, col * 0.15) * TERRAIN_CONFIG.GRADIENT_NOISE_AMPLITUDE;
    const effectiveDistance = distanceFromCenter + noiseValue;

    // Water in center
    const waterRadius = mapRadius * TERRAIN_CONFIG.LAKE_WATER_RADIUS_PERCENT;
    if (effectiveDistance < waterRadius) {
      return 'water';
    }

    // Sand ring around water
    const sandWidth = mapRadius * TERRAIN_CONFIG.LAKE_SAND_WIDTH_PERCENT;
    if (effectiveDistance < waterRadius + sandWidth) {
      return 'sand';
    }

    return 'grass';
  }

  private generateCoveTile(row: number, col: number): TerrainType {
    // Crescent shape entering from top-right
    const centerRow = this.mapRows * 0.3;
    const centerCol = this.mapCols * 0.7;
    const outerRadius = Math.min(this.mapRows, this.mapCols) * TERRAIN_CONFIG.COVE_RADIUS_PERCENT;
    const innerRadius = outerRadius * 0.3;

    // Check if in crescent (water area)
    const isInCrescent = isPointInCrescent(
      row,
      col,
      { x: centerCol, y: centerRow },
      outerRadius,
      innerRadius,
      45,  // Start angle
      225  // End angle (180 degree arc)
    );

    if (isInCrescent) {
      return 'water';
    }

    // Calculate distance from water edge
    const distanceFromCenter = calculateDistanceToPoint(row, col, centerRow, centerCol);
    const distanceFromWater = Math.abs(distanceFromCenter - outerRadius);

    const noiseValue = this.noise.noise2D(row * 0.1, col * 0.1) * TERRAIN_CONFIG.GRADIENT_NOISE_AMPLITUDE;
    const effectiveDistance = distanceFromWater + noiseValue;

    // Sand near water
    if (effectiveDistance < TERRAIN_CONFIG.COVE_SAND_WIDTH && distanceFromCenter > innerRadius) {
      return 'sand';
    }

    return 'grass';
  }

  private generatePeninsulaTile(row: number, col: number): TerrainType {
    // Peninsula runs diagonally from top-left to bottom-right
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;

    // Calculate perpendicular distance from diagonal line
    const lineStart: Point2D = { x: 0, y: 0 };
    const lineEnd: Point2D = { x: this.mapCols - 1, y: this.mapRows - 1 };
    
    const distanceFromAxis = perpendicularDistanceToLine(row, col, lineStart, lineEnd);
    const peninsulaWidth = Math.min(this.mapRows, this.mapCols) * TERRAIN_CONFIG.PENINSULA_WIDTH_PERCENT / 2;

    // Add noise
    const noiseValue = this.noise.noise2D(row * 0.1, col * 0.1) * TERRAIN_CONFIG.GRADIENT_NOISE_AMPLITUDE;
    const effectiveDistance = distanceFromAxis + noiseValue;

    // Outside peninsula = water
    if (effectiveDistance > peninsulaWidth) {
      return 'water';
    }

    // On peninsula - sand at edges, grass in center
    if (effectiveDistance > peninsulaWidth - TERRAIN_CONFIG.PENINSULA_SAND_EDGE_WIDTH) {
      return 'sand';
    }

    return 'grass';
  }

  private generateIslandTile(row: number, col: number): TerrainType {
    // Water at all edges
    const distanceFromEdge = getNearestEdgeDistance(row, col, this.mapRows, this.mapCols);

    if (distanceFromEdge < TERRAIN_CONFIG.ISLAND_WATER_DEPTH) {
      return 'water';
    }

    // Island area with organic shape
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;
    const distanceFromCenter = calculateDistanceToPoint(row, col, centerRow, centerCol);

    // Use noise to create organic island shape
    const noiseScale = TERRAIN_CONFIG.ISLAND_NOISE_SCALE;
    const noiseValue = this.noise.noise2D(row * noiseScale, col * noiseScale);
    
    // Island shape threshold (negative noise = more irregular)
    const maxRadius = Math.min(this.mapRows, this.mapCols) / 2 - TERRAIN_CONFIG.ISLAND_WATER_DEPTH - 5;
    const threshold = maxRadius * (0.7 + noiseValue * 0.3);

    if (distanceFromCenter > threshold) {
      return 'water';
    }

    // On island - gradient from sand to grass
    const distanceFromWater = distanceFromEdge - TERRAIN_CONFIG.ISLAND_WATER_DEPTH;
    const sandNoise = this.noise.noise2D(row * 0.15, col * 0.15) * 2;
    
    if (distanceFromWater + sandNoise < TERRAIN_CONFIG.ISLAND_SAND_WIDTH) {
      return 'sand';
    }

    return 'grass';
  }
}
