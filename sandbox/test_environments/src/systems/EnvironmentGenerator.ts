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
  private leftLinePath: Map<number, number> = new Map();
  private rightLinePath: Map<number, number> = new Map();

  constructor(mapRows: number, mapCols: number, seed: number = TERRAIN_CONFIG.SEED) {
    this.mapRows = mapRows;
    this.mapCols = mapCols;
    this.random = new SeededRandom(seed);
    this.noise = new SimplexNoise(seed);
    
    // Pre-generate the peninsula paths
    this.generatePeninsulaPaths();
  }

  private generatePeninsulaPaths(): void {
    // Generate two curved paths with variable curvature intensity
    let leftOffset = -15;  // Closer together (was -20)
    let rightOffset = 15;  // Closer together (was 20)
    
    // Trace along the diagonal
    for (let step = 0; step < this.mapRows + this.mapCols; step++) {
      // Store current positions
      this.leftLinePath.set(step, leftOffset);
      this.rightLinePath.set(step, rightOffset);
      
      // Variable curvature: sometimes gentle (±1), sometimes abrupt (±2 or ±3)
      const leftIntensity = Math.floor(this.random.next() * 4); // 0 to 3
      const rightIntensity = Math.floor(this.random.next() * 4); // 0 to 3
      
      const leftChange = leftIntensity === 0 ? 0 : 
                         (Math.floor(this.random.next() * (leftIntensity * 2 + 1)) - leftIntensity);
      const rightChange = rightIntensity === 0 ? 0 : 
                          (Math.floor(this.random.next() * (rightIntensity * 2 + 1)) - rightIntensity);
      
      leftOffset += leftChange;
      rightOffset += rightChange;
      
      // Make sure lines don't get too close or too far
      if (rightOffset - leftOffset < 15) rightOffset = leftOffset + 15;  // Minimum gap
      if (rightOffset - leftOffset > 50) rightOffset = leftOffset + 50;  // Maximum gap
    }
  }

  generate(type: EnvironmentType): TerrainMap {
    const tiles = new Map<string, TerrainType>();

    // Initialize all tiles as water
    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        tiles.set(tileKey(row, col), 'water');
      }
    }

    // Step 1: Generate path as sequence of coordinates
    let pathSequence: Array<{ row: number; col: number }> = [];

    switch (type) {
      case 'seafront':
        pathSequence = this.generateStraightLinePath();
        break;
      case 'lake':
        pathSequence = this.generateCirclePath();
        break;
      case 'cove':
        pathSequence = this.generateArcPath();
        break;
      case 'peninsula':
        pathSequence = this.generatePeninsulaPath();
        break;
      case 'island':
        pathSequence = this.generateCirclePath();
        break;
    }

    // Step 2: Mark all tiles in path sequence as grass
    pathSequence.forEach(({ row, col }) => {
      tiles.set(tileKey(row, col), 'grass');
    });

    // Step 3: Mark all 8 neighbors of path tiles as grass
    pathSequence.forEach(({ row, col }) => {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nRow = row + dr;
          const nCol = col + dc;
          if (nRow >= 0 && nRow < this.mapRows && nCol >= 0 && nCol < this.mapCols) {
            tiles.set(tileKey(nRow, nCol), 'grass');
          }
        }
      }
    });

    // Step 4: Grass filling
    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        const key = tileKey(row, col);
        if (tiles.get(key) !== 'grass') { // If not already grass
          switch (type) {
            case 'seafront':
              if (this.isInsideSeafront(row, col)) tiles.set(key, 'grass');
              break;
            case 'lake':
              if (!this.isInsideLake(row, col)) tiles.set(key, 'grass');
              break;
            case 'cove':
              if (!this.isInsideCove(row, col)) tiles.set(key, 'grass');
              break;
            case 'peninsula':
              if (this.isInsidePeninsula(row, col)) tiles.set(key, 'grass');
              break;
            case 'island':
              if (this.isInsideIsland(row, col)) tiles.set(key, 'grass');
              break;
          }
        }
      }
    }

    // Step 5: Apply sand gradient
    this.applySandGradient(tiles);

    // Step 6: Clean isolated tiles
    this.cleanIsolatedTiles(tiles);

    return {
      tiles,
      width: this.mapCols,
      height: this.mapRows,
    };
  }

  // ===== PATH GENERATION METHODS (geometric shapes, no noise) =====

  private generateStraightLinePath(): Array<{ row: number; col: number }> {
    const path: Array<{ row: number; col: number }> = [];
    
    // Random angle for the line
    if (this.seafrontLineAngle === 0 && this.seafrontLineOffset === 0) {
      this.seafrontLineAngle = this.random.next() * Math.PI * 2;
      this.seafrontLineOffset = 0;
    }

    // Trace line across entire map with slight variations
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;

    const perpAngle = this.seafrontLineAngle + Math.PI / 2;
    const length = Math.max(this.mapRows, this.mapCols) * 1.5;

    for (let t = -length; t <= length; t += 0.5) {
      // Add slight perpendicular variation using noise
      const variation = this.noise.noise2D(t * 0.05, 0) * 3;
      
      const x = centerCol + t * Math.cos(perpAngle) + variation * Math.cos(this.seafrontLineAngle);
      const y = centerRow + t * Math.sin(perpAngle) + variation * Math.sin(this.seafrontLineAngle);
      const col = Math.round(x);
      const row = Math.round(y);

      if (row >= 0 && row < this.mapRows && col >= 0 && col < this.mapCols) {
        if (!path.some(p => p.row === row && p.col === col)) {
          path.push({ row, col });
        }
      }
    }

    return path;
  }

  private generateCirclePath(): Array<{ row: number; col: number }> {
    const path: Array<{ row: number; col: number }> = [];
    
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;
    const baseRadius = Math.min(this.mapRows, this.mapCols) * 0.35;

    // Generate circle points with radius variations
    const numPoints = Math.ceil(baseRadius * Math.PI * 2 * 2);
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      
      // Add radius variation using noise
      const radiusVariation = this.noise.noise2D(Math.cos(angle) * 5, Math.sin(angle) * 5) * 3;
      const radius = baseRadius + radiusVariation;
      
      const x = centerCol + radius * Math.cos(angle);
      const y = centerRow + radius * Math.sin(angle);
      const col = Math.round(x);
      const row = Math.round(y);

      if (row >= 0 && row < this.mapRows && col >= 0 && col < this.mapCols) {
        if (!path.some(p => p.row === row && p.col === col)) {
          path.push({ row, col });
        }
      }
    }

    return path;
  }

  private generateArcPath(): Array<{ row: number; col: number }> {
    const path: Array<{ row: number; col: number }> = [];
    
    // Position circle to intersect exactly 2 edges of the map
    if (!this.coveCenter) {
      const side = Math.floor(this.random.next() * 4);
      
      let centerRow: number, centerCol: number;
      const baseRadius = Math.min(this.mapRows, this.mapCols) * 0.4;
      
      switch (side) {
        case 0: // Top edge
          centerRow = baseRadius * 0.6;
          centerCol = this.mapCols * (0.3 + this.random.next() * 0.4);
          break;
        case 1: // Right edge
          centerRow = this.mapRows * (0.3 + this.random.next() * 0.4);
          centerCol = this.mapCols - baseRadius * 0.6;
          break;
        case 2: // Bottom edge
          centerRow = this.mapRows - baseRadius * 0.6;
          centerCol = this.mapCols * (0.3 + this.random.next() * 0.4);
          break;
        default: // Left edge
          centerRow = this.mapRows * (0.3 + this.random.next() * 0.4);
          centerCol = baseRadius * 0.6;
          break;
      }
      
      this.coveCenter = { row: centerRow, col: centerCol };
      this.coveOuterRadius = baseRadius;
      this.coveInnerRadius = 0;
    }

    const centerRow = this.coveCenter!.row;
    const centerCol = this.coveCenter!.col;
    const baseRadius = this.coveOuterRadius;

    // Generate circle points with variations (only those inside map bounds)
    const numPoints = Math.ceil(baseRadius * Math.PI * 2 * 2);
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      
      // Add radius variation using noise
      const radiusVariation = this.noise.noise2D(Math.cos(angle) * 5, Math.sin(angle) * 5) * 2;
      const radius = baseRadius + radiusVariation;
      
      const x = centerCol + radius * Math.cos(angle);
      const y = centerRow + radius * Math.sin(angle);
      const col = Math.round(x);
      const row = Math.round(y);

      // Only add if inside map bounds
      if (row >= 0 && row < this.mapRows && col >= 0 && col < this.mapCols) {
        if (!path.some(p => p.row === row && p.col === col)) {
          path.push({ row, col });
        }
      }
    }

    return path;
  }

  private generatePeninsulaPath(): Array<{ row: number; col: number }> {
    const path: Array<{ row: number; col: number }> = [];

    // Trace both lines step by step along the diagonal
    for (let step = 0; step < this.mapRows + this.mapCols; step++) {
      const leftOffset = this.leftLinePath.get(step);
      const rightOffset = this.rightLinePath.get(step);
      
      if (leftOffset === undefined || rightOffset === undefined) continue;

      // For each diagonal step, find the tile that matches
      // Diagonal: tiles where row + col = step
      for (let row = 0; row < this.mapRows; row++) {
        const col = step - row;
        if (col < 0 || col >= this.mapCols) continue;

        const distanceFromDiagonal = col - row;
        
        // Left line: exact match to left offset
        if (distanceFromDiagonal === leftOffset) {
          path.push({ row, col });
        }
        
        // Right line: exact match to right offset
        if (distanceFromDiagonal === rightOffset) {
          if (!path.some(p => p.row === row && p.col === col)) {
            path.push({ row, col });
          }
        }
      }
    }

    return path;
  }

  // ===== ORIGINAL FILLING METHODS (kept for later use) =====

  // ===== SEAFRONT: Straight line with random orientation =====
  private seafrontLineAngle: number = 0;
  private seafrontLineOffset: number = 0;

  private initializeSeafront(): void {
    // Random angle (0-360 degrees)
    this.seafrontLineAngle = this.random.next() * Math.PI * 2;
    // Line goes through center with slight offset
    this.seafrontLineOffset = (this.random.next() - 0.5) * 10;
  }

  private isInsideSeafront(row: number, col: number): boolean {
    if (this.seafrontLineAngle === 0 && this.seafrontLineOffset === 0) {
      this.initializeSeafront();
    }

    // Calculate distance from line with slight variation
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;
    const relRow = row - centerRow;
    const relCol = col - centerCol;

    // Perpendicular distance from line
    const dist = relRow * Math.cos(this.seafrontLineAngle) - relCol * Math.sin(this.seafrontLineAngle);
    const noise = this.noise.noise2D(row * 0.05, col * 0.05) * 3;

    return (dist + noise + this.seafrontLineOffset) > 0;
  }

  // ===== LAKE: Circle, grass outside =====
  private isInsideLake(row: number, col: number): boolean {
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;
    const distance = calculateDistanceToPoint(row, col, centerRow, centerCol);
    const radius = Math.min(this.mapRows, this.mapCols) * 0.35;
    const noise = this.noise.noise2D(row * 0.08, col * 0.08) * 3;

    return distance < radius + noise;
  }

  // ===== ISLAND: Circle, grass inside =====
  private isInsideIsland(row: number, col: number): boolean {
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;
    const distance = calculateDistanceToPoint(row, col, centerRow, centerCol);
    const radius = Math.min(this.mapRows, this.mapCols) * 0.35;
    const noise = this.noise.noise2D(row * 0.08, col * 0.08) * 3;

    return distance < radius + noise;
  }

  // ===== COVE: Crescent, grass outside =====
  private coveCenter: { row: number; col: number } | null = null;
  private coveOuterRadius: number = 0;
  private coveInnerRadius: number = 0;

  private initializeCove(): void {
    // Try different positions until grass is majority
    for (let attempt = 0; attempt < 10; attempt++) {
      const centerRow = this.mapRows * (0.2 + this.random.next() * 0.6);
      const centerCol = this.mapCols * (0.2 + this.random.next() * 0.6);
      const outerRadius = Math.min(this.mapRows, this.mapCols) * (0.3 + this.random.next() * 0.2);
      const innerRadius = outerRadius * 0.6;

      // Count grass vs water
      let grassCount = 0;
      let waterCount = 0;

      for (let r = 0; r < this.mapRows; r++) {
        for (let c = 0; c < this.mapCols; c++) {
          const dist = calculateDistanceToPoint(r, c, centerRow, centerCol);
          const angle = Math.atan2(r - centerRow, c - centerCol);
          const isInCrescent = dist < outerRadius && dist > innerRadius &&
                               angle > -Math.PI / 2 && angle < Math.PI / 2;

          if (isInCrescent) waterCount++;
          else grassCount++;
        }
      }

      if (grassCount > waterCount) {
        this.coveCenter = { row: centerRow, col: centerCol };
        this.coveOuterRadius = outerRadius;
        this.coveInnerRadius = innerRadius;
        return;
      }
    }

    // Fallback if no good position found
    this.coveCenter = { row: this.mapRows * 0.25, col: this.mapCols * 0.75 };
    this.coveOuterRadius = Math.min(this.mapRows, this.mapCols) * 0.35;
    this.coveInnerRadius = this.coveOuterRadius * 0.6;
  }

  private isInsideCove(row: number, col: number): boolean {
    if (!this.coveCenter) {
      this.initializeCove();
    }

    const distance = calculateDistanceToPoint(row, col, this.coveCenter!.row, this.coveCenter!.col);
    const angle = Math.atan2(row - this.coveCenter!.row, col - this.coveCenter!.col);
    const noise = this.noise.noise2D(row * 0.08, col * 0.08) * 2;

    return distance < this.coveOuterRadius + noise &&
           distance > this.coveInnerRadius - noise &&
           angle > -Math.PI / 2 && angle < Math.PI / 2;
  }

  // ===== PENINSULA: Two curved lines, grass between =====
  private isInsidePeninsula(row: number, col: number): boolean {
    const diagonalStep = row + col;
    const distanceFromDiagonal = col - row;

    const leftLinePosition = this.leftLinePath.get(diagonalStep);
    const rightLinePosition = this.rightLinePath.get(diagonalStep);

    if (leftLinePosition === undefined || rightLinePosition === undefined) {
      return false;
    }

    // Check current and adjacent steps for continuity
    const prevStep = diagonalStep - 1;
    const nextStep = diagonalStep + 1;

    const prevLeftPos = this.leftLinePath.get(prevStep);
    const nextLeftPos = this.leftLinePath.get(nextStep);
    const prevRightPos = this.rightLinePath.get(prevStep);
    const nextRightPos = this.rightLinePath.get(nextStep);

    const leftMin = Math.min(
      leftLinePosition,
      prevLeftPos !== undefined ? prevLeftPos : leftLinePosition,
      nextLeftPos !== undefined ? nextLeftPos : leftLinePosition
    );
    const rightMax = Math.max(
      rightLinePosition,
      prevRightPos !== undefined ? prevRightPos : rightLinePosition,
      nextRightPos !== undefined ? nextRightPos : rightLinePosition
    );

    return distanceFromDiagonal >= leftMin && distanceFromDiagonal <= rightMax;
  }

  private cleanIsolatedTiles(tiles: Map<string, TerrainType>): void {
    // Clean up isolated tiles after sand generation
    const changes: Array<{ key: string; newType: TerrainType }> = [];

    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        const key = tileKey(row, col);
        const currentType = tiles.get(key);
        if (!currentType) continue;

        // Get edge-adjacent neighbors only (4 directions)
        const edgeNeighbors = this.getEdgeNeighborTypes(row, col, tiles);

        // For sand tiles: if no edge connection to other sand
        if (currentType === 'sand') {
          const hasSandNeighbor = edgeNeighbors.some(type => type === 'sand');
          if (!hasSandNeighbor) {
            // Convert to grass if neighbors are grass, otherwise water
            const hasGrassNeighbor = edgeNeighbors.some(type => type === 'grass');
            changes.push({ key, newType: hasGrassNeighbor ? 'grass' : 'water' });
          }
        }

        // For water tiles: if no edge connection to other water
        if (currentType === 'water') {
          const hasWaterNeighbor = edgeNeighbors.some(type => type === 'water');
          if (!hasWaterNeighbor) {
            // Convert to sand
            changes.push({ key, newType: 'sand' });
          }
        }
      }
    }

    // Apply all changes
    changes.forEach(({ key, newType }) => tiles.set(key, newType));
  }

  private getEdgeNeighborTypes(row: number, col: number, tiles: Map<string, TerrainType>): TerrainType[] {
    // Get only edge-adjacent neighbors (4 directions, no diagonals)
    const neighbors: TerrainType[] = [];
    const offsets = [
      [-1, 0], [1, 0], [0, -1], [0, 1]  // Up, Down, Left, Right
    ];

    for (const [dr, dc] of offsets) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < this.mapRows && c >= 0 && c < this.mapCols) {
        const neighborType = tiles.get(tileKey(r, c));
        if (neighborType) neighbors.push(neighborType);
      }
    }

    return neighbors;
  }

  private applySandGradient(tiles: Map<string, TerrainType>): void {
    // Apply sand gradient algorithm
    
    // First loop: Convert all water adjacent to grass → sand
    const firstPassChanges: Array<{ key: string }> = [];
    
    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        const key = tileKey(row, col);
        const currentType = tiles.get(key);
        
        if (currentType === 'grass') {
          // Check all 8 neighbors (edges + corners)
          const neighbors = this.getAllNeighborPositions(row, col);
          
          for (const [nRow, nCol] of neighbors) {
            const neighborKey = tileKey(nRow, nCol);
            const neighborType = tiles.get(neighborKey);
            
            if (neighborType === 'water') {
              firstPassChanges.push({ key: neighborKey });
            }
          }
        }
      }
    }
    
    // Apply first pass changes
    firstPassChanges.forEach(({ key }) => tiles.set(key, 'sand'));
    
    // Second loop: Repeat 2 times with decreasing random rate
    let randomRate = 0.5;
    
    for (let iteration = 0; iteration < 2; iteration++) {
      const changes: Array<{ key: string }> = [];
      
      for (let row = 0; row < this.mapRows; row++) {
        for (let col = 0; col < this.mapCols; col++) {
          const key = tileKey(row, col);
          const currentType = tiles.get(key);
          
          if (currentType === 'sand') {
            // Check all 8 neighbors
            const neighbors = this.getAllNeighborPositions(row, col);
            
            for (const [nRow, nCol] of neighbors) {
              const neighborKey = tileKey(nRow, nCol);
              const neighborType = tiles.get(neighborKey);
              
              if (neighborType === 'water') {
                // Randomly convert water to sand
                if (this.random.next() < randomRate) {
                  changes.push({ key: neighborKey });
                }
              }
            }
          }
        }
      }
      
      // Apply changes for this iteration
      changes.forEach(({ key }) => tiles.set(key, 'sand'));
      
      // Decrease random rate for next iteration
      randomRate -= 0.1;
    }
  }

  private getAllNeighborPositions(row: number, col: number): Array<[number, number]> {
    // Get all 8 neighbor positions (edges + corners)
    const neighbors: Array<[number, number]> = [];
    const offsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dr, dc] of offsets) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < this.mapRows && c >= 0 && c < this.mapCols) {
        neighbors.push([r, c]);
      }
    }
    
    return neighbors;
  }
}
