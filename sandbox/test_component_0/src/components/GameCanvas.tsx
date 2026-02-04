import React, { useRef, useEffect, useState } from 'react';
import { GameState, Establishment, PeopleGroup } from '../types';
import { getStateColor } from '../game';
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

interface GameCanvasProps {
  state: GameState;
  width: number;
  height: number;
}

// Track animations by entity ID
const entityAnimations = new Map<string, SpriteAnimation>();

/**
 * Canvas-based game renderer with sprite support
 */
export const GameCanvas: React.FC<GameCanvasProps> = ({ state, width, height }) => {
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

    // Draw grid
    drawGrid(ctx, width, height);

    // Draw attraction radius
    for (const establishment of state.establishments) {
      drawAttractionRadius(ctx, establishment);
    }

    // Draw establishments
    for (const establishment of state.establishments) {
      drawEstablishment(ctx, establishment, spritesLoaded, animationTimeRef.current);
    }

    // Draw people groups
    for (const group of state.groups) {
      drawPeopleGroup(ctx, group, spritesLoaded, animationTimeRef.current);
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
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;

  const gridSize = 50;

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
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
  currentTime: number
): void {
  const { x, y } = establishment.position;

  // Try to draw sprite first
  if (spritesLoaded) {
    const animation = getEstablishmentAnimation(establishment);
    // Update animation timing - use manifest speed (default 500ms for establishments)
    const sprite = spriteLoader.getSprite(animation.spriteId);
    const animSpeed = sprite?.manifest?.animationSpeed ?? 500;
    if (currentTime - animation.lastFrameTime > animSpeed) {
      animation.currentFrame = (animation.currentFrame + 1) % 2;
      animation.lastFrameTime = currentTime;
    }
    
    const drawn = drawSprite(ctx, animation, x, y, 1);
    if (drawn) {
      // Still draw the occupancy bar below the sprite
      drawOccupancyBar(ctx, establishment);
      return;
    }
  }

  // Fallback: Draw with canvas primitives
  drawEstablishmentFallback(ctx, establishment);
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
  drawOccupancyBar(ctx, establishment);
}

function drawOccupancyBar(ctx: CanvasRenderingContext2D, establishment: Establishment): void {
  const { x, y } = establishment.position;
  const size = 60;
  const barWidth = 50;
  const barHeight = 6;
  const barY = y + size / 2 + 10;
  const color = getStateColor(establishment.state);

  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight);

  // Fill
  const fillPercent = establishment.currentOccupancy / establishment.maxCapacity;
  ctx.fillStyle = color;
  ctx.fillRect(x - barWidth / 2, barY, barWidth * fillPercent, barHeight);

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - barWidth / 2, barY, barWidth, barHeight);

  // Occupancy text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${establishment.currentOccupancy}/${establishment.maxCapacity}`,
    x,
    barY + barHeight + 14
  );
}

function drawPeopleGroup(
  ctx: CanvasRenderingContext2D,
  group: PeopleGroup,
  spritesLoaded: boolean,
  currentTime: number
): void {
  const { x, y } = group.position;

  // Don't draw if visiting (they're "inside") or despawned
  if (group.state === 'visiting' || group.state === 'despawned') return;

  // Skip if position is way off screen
  if (x < -50 || x > 900 || y < -50 || y > 700) return;

  // Try to draw sprite first
  if (spritesLoaded) {
    const animation = getPeopleAnimation(group);
    // Update animation timing - use manifest speed (300ms for people)
    const sprite = spriteLoader.getSprite(animation.spriteId);
    const animSpeed = sprite?.manifest?.animationSpeed ?? 300;
    if (currentTime - animation.lastFrameTime > animSpeed) {
      animation.currentFrame = (animation.currentFrame + 1) % 2;
      animation.lastFrameTime = currentTime;
    }
    
    const drawn = drawSprite(ctx, animation, x, y, 1);
    if (drawn) {
      // Draw state indicator above sprite
      drawGroupStateIndicator(ctx, group);
      return;
    }
  }

  // Fallback: Draw with canvas primitives
  drawPeopleGroupFallback(ctx, group);
}

function drawGroupStateIndicator(ctx: CanvasRenderingContext2D, group: PeopleGroup): void {
  const { x, y } = group.position;
  
  let stateIcon = '';
  let iconColor = '#fff';
  
  switch (group.state) {
    case 'seeking':
      stateIcon = '🎯';
      iconColor = '#4ade80'; // Green for seeking
      break;
    case 'wandering':
      stateIcon = '❓';
      iconColor = '#facc15'; // Yellow for wandering
      break;
    case 'leaving':
      stateIcon = '👋';
      iconColor = '#f87171'; // Red for leaving
      break;
    case 'entering':
      stateIcon = '🚪';
      iconColor = '#60a5fa'; // Blue for entering
      break;
  }

  if (stateIcon) {
    ctx.fillStyle = iconColor;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stateIcon, x, y - 30);
  }
}

function drawPeopleGroupFallback(ctx: CanvasRenderingContext2D, group: PeopleGroup): void {
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
  drawGroupStateIndicator(ctx, group);
}
