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

    // Step 2: Mark all tiles in path sequence as GRASS (main line)
    pathSequence.forEach(({ row, col }) => {
      tiles.set(tileKey(row, col), 'grass');
    });

    // Step 3: Mark all 8 neighbors of path tiles as GRASS (thick line/area)
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

    // Step 4: Grass filling (filling is GRASS, line is SAND)
    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        const key = tileKey(row, col);
        if (tiles.get(key) === 'water') { // Only fill water tiles (not sand line)
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

  /**
   * Seafront path: reuse ONE of the peninsula's organic lines (left or right)
   * as the shoreline, so the shape is naturally curved across the diamond.
   */
  private generateStraightLinePath(): Array<{ row: number; col: number }> {
    const path: Array<{ row: number; col: number }> = [];

    // Randomly choose which peninsula line to reuse
    const useRight = this.random.next() < 0.5;
    this.seafrontLineSide = useRight ? 'right' : 'left';

    for (let step = 0; step < this.mapRows + this.mapCols; step++) {
      const lineOffset = useRight
        ? this.rightLinePath.get(step)
        : this.leftLinePath.get(step);

      if (lineOffset === undefined) continue;

      // For this diagonal step, find the tile whose distanceFromDiagonal
      // matches the chosen line's offset.
      for (let row = 0; row < this.mapRows; row++) {
        const col = step - row;
        if (col < 0 || col >= this.mapCols) continue;

        const distanceFromDiagonal = col - row;

        if (distanceFromDiagonal === lineOffset) {
          if (!path.some(p => p.row === row && p.col === col)) {
            path.push({ row, col });
          }
        }
      }
    }

    // After selecting which geometric line we use, decide which side of it
    // should become grass (the side with more tiles).
    this.initializeSeafrontFillSide();

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
    const radius = this.coveOuterRadius;

    // Generate circle points (perfect circle, no variations)
    const numPoints = Math.ceil(radius * Math.PI * 2 * 2);
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      
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

  // ===== SEAFRONT: Organic line based on peninsula geometry =====
  private seafrontFillSign: number = 1;
  private seafrontLineSide: 'left' | 'right' = 'left';

  /**
   * Get the "effective" line position (distanceFromDiagonal) for a given
   * diagonal step, using the selected peninsula line and averaging with
   * neighboring steps for continuity.
   */
  private getSeafrontLinePosition(step: number): number | undefined {
    const map =
      this.seafrontLineSide === 'right'
        ? this.rightLinePath
        : this.leftLinePath;

    const base = map.get(step);
    if (base === undefined) return undefined;

    const prev = map.get(step - 1);
    const next = map.get(step + 1);

    const a = base;
    const b = prev !== undefined ? prev : base;
    const c = next !== undefined ? next : base;

    return Math.round((a + b + c) / 3);
  }

  /**
   * Decide which side of the seafront line should become grass.
   * We pick the side that covers the larger portion of the map
   * so the fill always targets the "wider" part of the split.
   */
  private initializeSeafrontFillSide(): void {
    let positiveCount = 0;
    let negativeCount = 0;

    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        const diagonalStep = row + col;
        const linePos = this.getSeafrontLinePosition(diagonalStep);
        if (linePos === undefined) continue;

        const distanceFromDiagonal = col - row;
        const delta = distanceFromDiagonal - linePos;

        if (delta > 0) positiveCount++;
        else if (delta < 0) negativeCount++;
      }
    }

    this.seafrontFillSign = positiveCount >= negativeCount ? 1 : -1;
  }

  private isInsideSeafront(row: number, col: number): boolean {
    const diagonalStep = row + col;
    const linePos = this.getSeafrontLinePosition(diagonalStep);
    if (linePos === undefined) {
      return false;
    }

    const distanceFromDiagonal = col - row;
    const delta = distanceFromDiagonal - linePos;

    // `seafrontFillSign` is chosen so that we always keep the *wider*
    // side of the map as grass, relative to the curved peninsula-based line.
    return this.seafrontFillSign * delta >= 0;
  }

  // ===== LAKE: Circle, grass outside =====
  private isInsideLake(row: number, col: number): boolean {
    // Use SAME circle as line tracing
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;
    const distance = calculateDistanceToPoint(row, col, centerRow, centerCol);
    const radius = Math.min(this.mapRows, this.mapCols) * 0.35;

    return distance < radius;
  }

  // ===== ISLAND: Circle, grass inside =====
  private isInsideIsland(row: number, col: number): boolean {
    // Use SAME circle as line tracing
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;
    const distance = calculateDistanceToPoint(row, col, centerRow, centerCol);
    const radius = Math.min(this.mapRows, this.mapCols) * 0.35;

    return distance < radius;
  }

  // ===== COVE: Circle intersecting 2 edges, grass outside =====
  private isInsideCove(row: number, col: number): boolean {
    // Use SAME circle as line tracing
    const centerRow = this.coveCenter!.row;
    const centerCol = this.coveCenter!.col;
    const distance = calculateDistanceToPoint(row, col, centerRow, centerCol);
    const radius = this.coveOuterRadius;

    return distance < radius;
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
