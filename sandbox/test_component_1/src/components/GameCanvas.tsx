import React, { useRef, useEffect, useState } from 'react';
import { GameState, Establishment, PeopleGroup, Vector2 } from '../types';
import { getStateColor, GridManager } from '../game';
import { Tile, TILE_COLORS } from '../types/tiles';
import {
  spriteLoader,
  createEstablishmentAnimation,
  createPeopleAnimation,
  setAnimationState,
  setFacingDirection,
  drawSprite,
  getPeopleCategoryFromSize,
  SpriteAnimation,
  FacingDirection,
} from '../assets';

// Isometric conversion constants
const TILE_WIDTH = 64;  // Width of diamond tile
const TILE_HEIGHT = 32; // Height of diamond tile
const GRID_COLS = 20;
const GRID_ROWS = 20;

// Convert grid coordinates to isometric screen position
// Grid coordinate (x, y) maps to the geometric CENTER of the isometric diamond at that position
function gridToIso(gridX: number, gridY: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } {
  const isoX = (gridX - gridY) * (TILE_WIDTH / 2);
  const isoY = (gridX + gridY) * (TILE_HEIGHT / 2);
  
  // Center the grid on canvas
  const offsetX = canvasWidth / 2;
  const offsetY = canvasHeight / 2 - (GRID_ROWS * TILE_HEIGHT / 2);
  
  return {
    x: isoX + offsetX,
    y: isoY + offsetY
  };
}

// Convert screen position to grid coordinates (for gameplay logic)
function isoToGrid(screenX: number, screenY: number, canvasWidth: number, canvasHeight: number): { gridX: number; gridY: number } {
  const offsetX = canvasWidth / 2;
  const offsetY = canvasHeight / 2 - (GRID_ROWS * TILE_HEIGHT / 2);
  
  const relX = screenX - offsetX;
  const relY = screenY - offsetY;
  
  const gridX = (relX / (TILE_WIDTH / 2) + relY / (TILE_HEIGHT / 2)) / 2;
  const gridY = (relY / (TILE_HEIGHT / 2) - relX / (TILE_WIDTH / 2)) / 2;
  
  return { gridX, gridY };
}

interface GameCanvasProps {
  state: GameState;
  width: number;
  height: number;
  gridManager?: GridManager;
}

// Track animations by entity ID
const entityAnimations = new Map<string, SpriteAnimation>();

/**
 * Canvas-based game renderer with sprite support and pathfinding visualization
 */
export const GameCanvas: React.FC<GameCanvasProps> = ({ state, width, height, gridManager }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const animationTimeRef = useRef(0);

  // Load sprites on mount
  useEffect(() => {
    spriteLoader.loadAll().then(() => {
      setSpritesLoaded(spriteLoader.getLoadingState().status === 'loaded');
    });
  }, []);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update animation time
    animationTimeRef.current = performance.now();

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw tile-based grid with colors
    if (gridManager) {
      drawTileGrid(ctx, width, height, gridManager);
    } else {
      // Fallback: draw simple grid
      drawGrid(ctx, width, height);
    }

    // Draw establishments
    for (const establishment of state.establishments) {
      drawEstablishment(ctx, establishment, spritesLoaded, animationTimeRef.current, width, height);
    }

    // Draw people groups
    for (const group of state.groups) {
      drawPeopleGroup(ctx, group, spritesLoaded, animationTimeRef.current, width, height);
    }

    // Clean up animations for removed entities
    cleanupAnimations(state);

  }, [state, width, height, spritesLoaded]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        border: '2px solid #ff6b9d',
        borderRadius: '8px',
        boxShadow: '0 0 20px rgba(255, 107, 157, 0.3)',
      }}
    />
  );
};

/**
 * Clean up animations for entities that no longer exist
 */
function cleanupAnimations(state: GameState): void {
  const activeIds = new Set([
    ...state.establishments.map(e => e.id),
    ...state.groups.map(g => g.id),
  ]);

  for (const id of entityAnimations.keys()) {
    if (!activeIds.has(id)) {
      entityAnimations.delete(id);
    }
  }
}

/**
 * Get or create animation for an establishment
 */
function getEstablishmentAnimation(establishment: Establishment): SpriteAnimation {
  let animation = entityAnimations.get(establishment.id);
  
  if (!animation) {
    animation = createEstablishmentAnimation('house');
    entityAnimations.set(establishment.id, animation);
  }

  // Update state based on establishment state
  setAnimationState(animation, establishment.state, false);
  
  return animation;
}

/**
 * Get or create animation for a people group
 */
function getPeopleAnimation(group: PeopleGroup): SpriteAnimation {
  let animation = entityAnimations.get(group.id);
  
  if (!animation) {
    const category = getPeopleCategoryFromSize(group.size);
    const variant = Math.floor(Math.random() * 3); // Random variant
    animation = createPeopleAnimation(category, variant);
    entityAnimations.set(group.id, animation);
  }

  // Update sprite state based on group's facing direction
  const directionToState: Record<string, FacingDirection> = {
    'up': 'look_up',
    'down': 'look_down',
    'left': 'look_side',
    'right': 'look_side',
  };
  
  const spriteState = directionToState[group.facingDirection] || 'look_down';
  const facingLeft = group.facingDirection === 'left';
  
  setFacingDirection(animation, spriteState, facingLeft);
  
  return animation;
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  // Draw diamond grid at tile centers
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      // Get position of tile CENTER (col + 0.5, row + 0.5)
      const pos = gridToIso(col + 0.5, row + 0.5, width, height);
      
      // Draw diamond shape
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - TILE_HEIGHT / 2); // Top
      ctx.lineTo(pos.x + TILE_WIDTH / 2, pos.y); // Right
      ctx.lineTo(pos.x, pos.y + TILE_HEIGHT / 2); // Bottom
      ctx.lineTo(pos.x - TILE_WIDTH / 2, pos.y); // Left
      ctx.closePath();
      ctx.stroke();
    }
  }
}

/**
 * Draw tile-based grid with different colors for tile types
 */
function drawTileGrid(ctx: CanvasRenderingContext2D, width: number, height: number, gridManager: GridManager): void {
  const tiles = gridManager.getAllTiles();
  
  for (let row = 0; row < tiles.length; row++) {
    for (let col = 0; col < tiles[row].length; col++) {
      const tile = tiles[row][col];
      // Get position of tile CENTER (col + 0.5, row + 0.5)
      const pos = gridToIso(col + 0.5, row + 0.5, width, height);
      
      // Fill tile with color based on type
      ctx.fillStyle = TILE_COLORS[tile.type];
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - TILE_HEIGHT / 2); // Top
      ctx.lineTo(pos.x + TILE_WIDTH / 2, pos.y); // Right
      ctx.lineTo(pos.x, pos.y + TILE_HEIGHT / 2); // Bottom
      ctx.lineTo(pos.x - TILE_WIDTH / 2, pos.y); // Left
      ctx.closePath();
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

/**
 * Draw path visualization for a group
 */
function drawPath(ctx: CanvasRenderingContext2D, path: Vector2[], width: number, height: number, color: string): void {
  if (path.length < 2) return;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.globalAlpha = 0.6;
  
  ctx.beginPath();
  const startPos = gridToIso(path[0].x, path[0].y, width, height);
  ctx.moveTo(startPos.x, startPos.y);
  
  for (let i = 1; i < path.length; i++) {
    const pos = gridToIso(path[i].x, path[i].y, width, height);
    ctx.lineTo(pos.x, pos.y);
  }
  
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function drawAttractionRadius(ctx: CanvasRenderingContext2D, establishment: Establishment): void {
  if (!establishment.isOpen) return;

  const gradient = ctx.createRadialGradient(
    establishment.position.x,
    establishment.position.y,
    0,
    establishment.position.x,
    establishment.position.y,
    establishment.attractionRadius
  );

  const color = getStateColor(establishment.state);
  gradient.addColorStop(0, `${color}15`);
  gradient.addColorStop(0.7, `${color}08`);
  gradient.addColorStop(1, `${color}00`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(
    establishment.position.x,
    establishment.position.y,
    establishment.attractionRadius,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Draw radius border
  ctx.strokeStyle = `${color}30`;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(
    establishment.position.x,
    establishment.position.y,
    establishment.attractionRadius,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawEstablishment(
  ctx: CanvasRenderingContext2D,
  establishment: Establishment,
  spritesLoaded: boolean,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  // Use stored grid position if available, otherwise convert from screen
  let gridX: number, gridY: number;
  
  if (establishment.gridPosition) {
    gridX = establishment.gridPosition.x;
    gridY = establishment.gridPosition.y;
  } else {
    const gridPos = isoToGrid(establishment.position.x, establishment.position.y, canvasWidth, canvasHeight);
    gridX = Math.round(gridPos.gridX);
    gridY = Math.round(gridPos.gridY);
  }
  
  const screenPos = gridToIso(gridX, gridY, canvasWidth, canvasHeight);

  // Draw based on establishment size (in tiles)
  const size = establishment.maxCapacity <= 4 ? 1 : establishment.maxCapacity <= 8 ? 2 : 3;
  const color = getStateColor(establishment.state);
  
  // Draw multiple tiles for larger establishments
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      const tileGridX = gridX + dx - Math.floor(size / 2);
      const tileGridY = gridY + dy - Math.floor(size / 2);
      const tilePos = gridToIso(tileGridX, tileGridY, canvasWidth, canvasHeight);
      
      // Draw filled diamond
      ctx.fillStyle = establishment.isOpen ? color : '#333';
      ctx.globalAlpha = establishment.isOpen ? 0.8 : 0.5;
      ctx.beginPath();
      ctx.moveTo(tilePos.x, tilePos.y - TILE_HEIGHT / 2);
      ctx.lineTo(tilePos.x + TILE_WIDTH / 2, tilePos.y);
      ctx.lineTo(tilePos.x, tilePos.y + TILE_HEIGHT / 2);
      ctx.lineTo(tilePos.x - TILE_WIDTH / 2, tilePos.y);
      ctx.closePath();
      ctx.fill();
      
      // Draw border
      ctx.globalAlpha = 1;
      ctx.strokeStyle = establishment.isOpen ? '#fff' : '#666';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  ctx.globalAlpha = 1;

  // Draw occupancy bar above establishment
  drawOccupancyBar(ctx, establishment, screenPos.x, screenPos.y - (size * TILE_HEIGHT / 2) - 10);
}

function drawEstablishmentFallback(ctx: CanvasRenderingContext2D, establishment: Establishment): void {
  const { x, y } = establishment.position;
  const size = 60;
  const color = getStateColor(establishment.state);

  // Building shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x - size / 2 + 5, y - size / 2 + 5, size, size);

  // Building base
  ctx.fillStyle = establishment.isOpen ? color : '#333';
  ctx.fillRect(x - size / 2, y - size / 2, size, size);

  // Building border
  ctx.strokeStyle = establishment.isOpen ? '#fff' : '#666';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - size / 2, y - size / 2, size, size);

  // Roof
  ctx.fillStyle = establishment.isOpen ? '#ff6b9d' : '#444';
  ctx.beginPath();
  ctx.moveTo(x - size / 2 - 10, y - size / 2);
  ctx.lineTo(x, y - size / 2 - 25);
  ctx.lineTo(x + size / 2 + 10, y - size / 2);
  ctx.closePath();
  ctx.fill();

  // Door
  const doorWidth = 15;
  const doorHeight = 25;
  ctx.fillStyle = establishment.isOpen ? '#1a1a2e' : '#222';
  ctx.fillRect(x - doorWidth / 2, y + size / 2 - doorHeight, doorWidth, doorHeight);

  // Occupancy bar
  drawOccupancyBar(ctx, establishment, x, y - 40);
}

function drawOccupancyBar(ctx: CanvasRenderingContext2D, establishment: Establishment, x: number, y: number): void {
  const barWidth = 50;
  const barHeight = 6;
  const color = getStateColor(establishment.state);

  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

  // Fill
  const fillPercent = establishment.currentOccupancy / establishment.maxCapacity;
  ctx.fillStyle = color;
  ctx.fillRect(x - barWidth / 2, y, barWidth * fillPercent, barHeight);

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);

  // Occupancy text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${establishment.currentOccupancy}/${establishment.maxCapacity}`,
    x,
    y + barHeight + 14
  );
}

function drawPeopleGroup(
  ctx: CanvasRenderingContext2D,
  group: PeopleGroup,
  spritesLoaded: boolean,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  // Don't draw if visiting or despawned
  if (group.state === 'visiting' || group.state === 'despawned') return;

  // Draw path if group is seeking OR wandering and has a path
  if ((group.state === 'seeking' || group.state === 'wandering') && group.path && group.path.length > 0) {
    drawPath(ctx, group.path, canvasWidth, canvasHeight, group.color);
  }

  // Convert grid position directly to isometric screen position
  const screenPos = gridToIso(group.position.x, group.position.y, canvasWidth, canvasHeight);


  // Skip if way off screen
  if (screenPos.x < -50 || screenPos.x > canvasWidth + 50 || screenPos.y < -50 || screenPos.y > canvasHeight + 50) {
    return;
  }

  const radius = 8 + group.size * 2;

  // Main circle
  ctx.fillStyle = group.color;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Direction indicator
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let directionArrow = '▼';
  switch (group.facingDirection) {
    case 'up': directionArrow = '▲'; break;
    case 'down': directionArrow = '▼'; break;
    case 'left': directionArrow = '◀'; break;
    case 'right': directionArrow = '▶'; break;
  }
  ctx.fillText(directionArrow, screenPos.x, screenPos.y);

  // Size badge
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText(group.size.toString(), screenPos.x, screenPos.y - radius - 8);

  // State indicator
  drawGroupStateIndicator(ctx, group, screenPos.x, screenPos.y);
}

function drawGroupStateIndicator(ctx: CanvasRenderingContext2D, group: PeopleGroup, x: number, y: number): void {
  let stateIcon = '';
  let iconColor = '#fff';

  switch (group.state) {
    case 'seeking':
      stateIcon = '🎯';
      iconColor = '#4ade80';
      break;
    case 'wandering':
      stateIcon = '❓';
      iconColor = '#facc15';
      break;
    case 'leaving':
      stateIcon = '👋';
      iconColor = '#f87171';
      break;
    case 'entering':
      stateIcon = '🚪';
      iconColor = '#60a5fa';
      break;
  }

  if (stateIcon) {
    ctx.fillStyle = iconColor;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stateIcon, x, y - 30);
  }
}

function drawPeopleGroupFallback(ctx: CanvasRenderingContext2D, group: PeopleGroup, canvasWidth: number, canvasHeight: number): void {
  const { x, y } = group.position;
  const radius = 8 + group.size * 2;

  // Glow effect
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
  gradient.addColorStop(0, `${group.color}40`);
  gradient.addColorStop(1, `${group.color}00`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Main circle
  ctx.fillStyle = group.color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Direction indicator (arrow showing facing direction)
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  let directionArrow = '▼';
  switch (group.facingDirection) {
    case 'up': directionArrow = '▲'; break;
    case 'down': directionArrow = '▼'; break;
    case 'left': directionArrow = '◀'; break;
    case 'right': directionArrow = '▶'; break;
  }
  ctx.fillText(directionArrow, x, y);
  
  // Size badge
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText(group.size.toString(), x, y - radius - 8);

  // Draw movement line if seeking
  if (group.state === 'seeking' && group.targetPosition) {
    ctx.strokeStyle = `${group.color}50`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(group.targetPosition.x, group.targetPosition.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // State indicator
  const screenPos2 = gridToIso(group.position.x, group.position.y, canvasWidth, canvasHeight);
  drawGroupStateIndicator(ctx, group, screenPos2.x, screenPos2.y - 25);
}
