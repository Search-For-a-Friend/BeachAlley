// Environment generator - procedural terrain generation for each environment type

import { EnvironmentType, TerrainMap, TerrainType } from '../types/environment';
import { TERRAIN_CONFIG } from '../data/terrainConfig';
import { SeededRandom } from '../utils/SeededRandom';
import { tileKey, calculateDistanceToPoint, SimplexNoise } from '../utils/terrainGeneration';

export class EnvironmentGenerator {
  private mapRows: number;
  private mapCols: number;
  private random: SeededRandom;
  private noise: SimplexNoise;
  private leftLinePath: Map<number, number> = new Map();
  private rightLinePath: Map<number, number> = new Map();
  private coveCenter: { row: number; col: number } | null = null;
  private coveOuterRadius: number = 0;
  private coveInnerRadius: number = 0;

  constructor(mapRows: number, mapCols: number, seed: number = TERRAIN_CONFIG.SEED) {
    this.mapRows = mapRows;
    this.mapCols = mapCols;
    this.random = new SeededRandom(seed);
    this.noise = new SimplexNoise(seed);
    this.generatePeninsulaPaths();
  }

  private generatePeninsulaPaths(): void {
    let leftOffset = -15;
    let rightOffset = 15;
    for (let step = 0; step < this.mapRows + this.mapCols; step++) {
      this.leftLinePath.set(step, leftOffset);
      this.rightLinePath.set(step, rightOffset);
      const leftIntensity = Math.floor(this.random.next() * 4);
      const rightIntensity = Math.floor(this.random.next() * 4);
      const leftChange = leftIntensity === 0 ? 0 : (Math.floor(this.random.next() * (leftIntensity * 2 + 1)) - leftIntensity);
      const rightChange = rightIntensity === 0 ? 0 : (Math.floor(this.random.next() * (rightIntensity * 2 + 1)) - rightIntensity);
      leftOffset += leftChange;
      rightOffset += rightChange;
      if (rightOffset - leftOffset < 15) rightOffset = leftOffset + 15;
      if (rightOffset - leftOffset > 50) rightOffset = leftOffset + 50;
    }
  }

  generate(type: EnvironmentType): TerrainMap {
    const tiles = new Map<string, TerrainType>();
    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        tiles.set(tileKey(row, col), 'water');
      }
    }

    let pathSequence: Array<{ row: number; col: number }> = [];
    switch (type) {
      case 'seafront': pathSequence = this.generateStraightLinePath(); break;
      case 'lake': pathSequence = this.generateCirclePath(); break;
      case 'cove': pathSequence = this.generateArcPath(); break;
      case 'peninsula': pathSequence = this.generatePeninsulaPath(); break;
      case 'island': pathSequence = this.generateCirclePath(); break;
    }

    pathSequence.forEach(({ row, col }) => tiles.set(tileKey(row, col), 'grass'));
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

    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        const key = tileKey(row, col);
        if (tiles.get(key) === 'water') {
          switch (type) {
            case 'seafront': if (this.isInsideSeafront(row, col)) tiles.set(key, 'grass'); break;
            case 'lake': if (!this.isInsideLake(row, col)) tiles.set(key, 'grass'); break;
            case 'cove': if (!this.isInsideCove(row, col)) tiles.set(key, 'grass'); break;
            case 'peninsula': if (this.isInsidePeninsula(row, col)) tiles.set(key, 'grass'); break;
            case 'island': if (this.isInsideIsland(row, col)) tiles.set(key, 'grass'); break;
          }
        }
      }
    }

    this.applySandGradient(tiles);
    this.cleanIsolatedTiles(tiles);
    return { tiles, width: this.mapCols, height: this.mapRows };
  }

  private generateStraightLinePath(): Array<{ row: number; col: number }> {
    const path: Array<{ row: number; col: number }> = [];
    const useRight = this.random.next() < 0.5;
    this.seafrontLineSide = useRight ? 'right' : 'left';
    for (let step = 0; step < this.mapRows + this.mapCols; step++) {
      const lineOffset = useRight ? this.rightLinePath.get(step) : this.leftLinePath.get(step);
      if (lineOffset === undefined) continue;
      for (let row = 0; row < this.mapRows; row++) {
        const col = step - row;
        if (col < 0 || col >= this.mapCols) continue;
        if (col - row === lineOffset && !path.some(p => p.row === row && p.col === col)) {
          path.push({ row, col });
        }
      }
    }
    this.initializeSeafrontFillSide();
    return path;
  }

  private seafrontFillSign: number = 1;
  private seafrontLineSide: 'left' | 'right' = 'left';

  private getSeafrontLinePosition(step: number): number | undefined {
    const map = this.seafrontLineSide === 'right' ? this.rightLinePath : this.leftLinePath;
    const base = map.get(step);
    if (base === undefined) return undefined;
    const prev = map.get(step - 1);
    const next = map.get(step + 1);
    return Math.round((base + (prev ?? base) + (next ?? base)) / 3);
  }

  private initializeSeafrontFillSide(): void {
    let positiveCount = 0;
    let negativeCount = 0;
    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        const linePos = this.getSeafrontLinePosition(row + col);
        if (linePos === undefined) continue;
        const delta = (col - row) - linePos;
        if (delta > 0) positiveCount++;
        else if (delta < 0) negativeCount++;
      }
    }
    this.seafrontFillSign = positiveCount >= negativeCount ? 1 : -1;
  }

  private isInsideSeafront(row: number, col: number): boolean {
    const linePos = this.getSeafrontLinePosition(row + col);
    if (linePos === undefined) return false;
    return this.seafrontFillSign * ((col - row) - linePos) >= 0;
  }

  private generateCirclePath(): Array<{ row: number; col: number }> {
    const path: Array<{ row: number; col: number }> = [];
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;
    const baseRadius = Math.min(this.mapRows, this.mapCols) * 0.35;
    const numPoints = Math.ceil(baseRadius * Math.PI * 2 * 2);
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radiusVariation = this.noise.noise2D(Math.cos(angle) * 5, Math.sin(angle) * 5) * 3;
      const radius = baseRadius + radiusVariation;
      const col = Math.round(centerCol + radius * Math.cos(angle));
      const row = Math.round(centerRow + radius * Math.sin(angle));
      if (row >= 0 && row < this.mapRows && col >= 0 && col < this.mapCols && !path.some(p => p.row === row && p.col === col)) {
        path.push({ row, col });
      }
    }
    return path;
  }

  private generateArcPath(): Array<{ row: number; col: number }> {
    const path: Array<{ row: number; col: number }> = [];
    if (!this.coveCenter) {
      const side = Math.floor(this.random.next() * 4);
      const baseRadius = Math.min(this.mapRows, this.mapCols) * 0.4;
      let centerRow: number, centerCol: number;
      switch (side) {
        case 0: centerRow = baseRadius * 0.6; centerCol = this.mapCols * (0.3 + this.random.next() * 0.4); break;
        case 1: centerRow = this.mapRows * (0.3 + this.random.next() * 0.4); centerCol = this.mapCols - baseRadius * 0.6; break;
        case 2: centerRow = this.mapRows - baseRadius * 0.6; centerCol = this.mapCols * (0.3 + this.random.next() * 0.4); break;
        default: centerRow = this.mapRows * (0.3 + this.random.next() * 0.4); centerCol = baseRadius * 0.6; break;
      }
      this.coveCenter = { row: centerRow, col: centerCol };
      this.coveOuterRadius = baseRadius;
      this.coveInnerRadius = 0;
    }
    const centerRow = this.coveCenter!.row;
    const centerCol = this.coveCenter!.col;
    const radius = this.coveOuterRadius;
    const numPoints = Math.ceil(radius * Math.PI * 2 * 2);
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const col = Math.round(centerCol + radius * Math.cos(angle));
      const row = Math.round(centerRow + radius * Math.sin(angle));
      if (row >= 0 && row < this.mapRows && col >= 0 && col < this.mapCols && !path.some(p => p.row === row && p.col === col)) {
        path.push({ row, col });
      }
    }
    return path;
  }

  private generatePeninsulaPath(): Array<{ row: number; col: number }> {
    const path: Array<{ row: number; col: number }> = [];
    for (let step = 0; step < this.mapRows + this.mapCols; step++) {
      const leftOffset = this.leftLinePath.get(step);
      const rightOffset = this.rightLinePath.get(step);
      if (leftOffset === undefined || rightOffset === undefined) continue;
      for (let row = 0; row < this.mapRows; row++) {
        const col = step - row;
        if (col < 0 || col >= this.mapCols) continue;
        const d = col - row;
        if (d === leftOffset) path.push({ row, col });
        if (d === rightOffset && !path.some(p => p.row === row && p.col === col)) path.push({ row, col });
      }
    }
    return path;
  }

  private isInsideLake(row: number, col: number): boolean {
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;
    return calculateDistanceToPoint(row, col, centerRow, centerCol) < Math.min(this.mapRows, this.mapCols) * 0.35;
  }

  private isInsideIsland(row: number, col: number): boolean {
    const centerRow = this.mapRows / 2;
    const centerCol = this.mapCols / 2;
    return calculateDistanceToPoint(row, col, centerRow, centerCol) < Math.min(this.mapRows, this.mapCols) * 0.35;
  }

  private isInsideCove(row: number, col: number): boolean {
    return calculateDistanceToPoint(row, col, this.coveCenter!.row, this.coveCenter!.col) < this.coveOuterRadius;
  }

  private isInsidePeninsula(row: number, col: number): boolean {
    const diagonalStep = row + col;
    const distanceFromDiagonal = col - row;
    const leftLinePosition = this.leftLinePath.get(diagonalStep);
    const rightLinePosition = this.rightLinePath.get(diagonalStep);
    if (leftLinePosition === undefined || rightLinePosition === undefined) return false;
    const prevLeftPos = this.leftLinePath.get(diagonalStep - 1);
    const nextLeftPos = this.leftLinePath.get(diagonalStep + 1);
    const prevRightPos = this.rightLinePath.get(diagonalStep - 1);
    const nextRightPos = this.rightLinePath.get(diagonalStep + 1);
    const leftMin = Math.min(leftLinePosition, prevLeftPos ?? leftLinePosition, nextLeftPos ?? leftLinePosition);
    const rightMax = Math.max(rightLinePosition, prevRightPos ?? rightLinePosition, nextRightPos ?? rightLinePosition);
    return distanceFromDiagonal >= leftMin && distanceFromDiagonal <= rightMax;
  }

  private cleanIsolatedTiles(tiles: Map<string, TerrainType>): void {
    const changes: Array<{ key: string; newType: TerrainType }> = [];
    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        const key = tileKey(row, col);
        const currentType = tiles.get(key);
        if (!currentType) continue;
        const edgeNeighbors = this.getEdgeNeighborTypes(row, col, tiles);
        if (currentType === 'sand' && !edgeNeighbors.some(t => t === 'sand')) {
          changes.push({ key, newType: edgeNeighbors.some(t => t === 'grass') ? 'grass' : 'water' });
        }
        if (currentType === 'water' && !edgeNeighbors.some(t => t === 'water')) {
          changes.push({ key, newType: 'sand' });
        }
      }
    }
    changes.forEach(({ key, newType }) => tiles.set(key, newType));
  }

  private getEdgeNeighborTypes(row: number, col: number, tiles: Map<string, TerrainType>): TerrainType[] {
    const neighbors: TerrainType[] = [];
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < this.mapRows && c >= 0 && c < this.mapCols) {
        const t = tiles.get(tileKey(r, c));
        if (t) neighbors.push(t);
      }
    }
    return neighbors;
  }

  private applySandGradient(tiles: Map<string, TerrainType>): void {
    const firstPassChanges: Array<{ key: string }> = [];
    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        if (tiles.get(tileKey(row, col)) !== 'grass') continue;
        for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
          const nRow = row + dr;
          const nCol = col + dc;
          if (nRow >= 0 && nRow < this.mapRows && nCol >= 0 && nCol < this.mapCols && tiles.get(tileKey(nRow, nCol)) === 'water') {
            firstPassChanges.push({ key: tileKey(nRow, nCol) });
          }
        }
      }
    }
    firstPassChanges.forEach(({ key }) => tiles.set(key, 'sand'));
    let randomRate = 0.5;
    for (let iteration = 0; iteration < 2; iteration++) {
      const changes: Array<{ key: string }> = [];
      for (let row = 0; row < this.mapRows; row++) {
        for (let col = 0; col < this.mapCols; col++) {
          if (tiles.get(tileKey(row, col)) !== 'sand') continue;
          for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
            const nRow = row + dr;
            const nCol = col + dc;
            if (nRow >= 0 && nRow < this.mapRows && nCol >= 0 && nCol < this.mapCols && tiles.get(tileKey(nRow, nCol)) === 'water' && this.random.next() < randomRate) {
              changes.push({ key: tileKey(nRow, nCol) });
            }
          }
        }
      }
      changes.forEach(({ key }) => tiles.set(key, 'sand'));
      randomRate -= 0.1;
    }
  }
}
