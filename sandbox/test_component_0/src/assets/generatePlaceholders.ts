/**
 * Placeholder Sprite Generator
 * 
 * Generates simple colored placeholder sprites for testing the sprite system
 * before actual artwork is available. Run this in the browser console or
 * use it to create placeholder images.
 */

import { EstablishmentSpriteManifest, PeopleSpriteManifest } from './types';

/**
 * Generate a placeholder spritesheet canvas for an establishment
 */
export function generateEstablishmentPlaceholder(
  manifest: EstablishmentSpriteManifest
): HTMLCanvasElement {
  const states = Object.entries(manifest.states);
  const cols = Math.max(...states.map(([, s]) => s.frames));
  const rows = states.length;
  
  const canvas = document.createElement('canvas');
  canvas.width = manifest.frameWidth * cols;
  canvas.height = manifest.frameHeight * rows;
  
  const ctx = canvas.getContext('2d')!;
  
  // Colors for each state
  const stateColors: Record<string, string> = {
    closed: '#4a4a4a',
    deserted: '#6b7280',
    visited: '#22c55e',
    busy: '#f59e0b',
    crowded: '#ef4444',
  };
  
  for (const [stateName, stateConfig] of states) {
    const y = stateConfig.row * manifest.frameHeight;
    const color = stateColors[stateName] || '#888';
    
    for (let frame = 0; frame < stateConfig.frames; frame++) {
      const x = frame * manifest.frameWidth;
      
      // Draw building placeholder
      ctx.fillStyle = color;
      const padding = 4;
      const w = manifest.frameWidth - padding * 2;
      const h = manifest.frameHeight - padding * 2 - 15;
      
      // Building body
      ctx.fillRect(x + padding, y + padding + 15, w, h);
      
      // Roof
      ctx.fillStyle = '#ff6b9d';
      ctx.beginPath();
      ctx.moveTo(x + padding - 5, y + padding + 15);
      ctx.lineTo(x + manifest.frameWidth / 2, y + padding);
      ctx.lineTo(x + manifest.frameWidth - padding + 5, y + padding + 15);
      ctx.closePath();
      ctx.fill();
      
      // Door
      ctx.fillStyle = '#1a1a2e';
      const doorW = 10;
      const doorH = 18;
      ctx.fillRect(
        x + manifest.frameWidth / 2 - doorW / 2,
        y + manifest.frameHeight - padding - doorH,
        doorW,
        doorH
      );
      
      // Animation variation: add subtle movement indicator
      if (frame === 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + padding + 2, y + padding + 17, w - 4, h - 4);
      }
      
      // State label
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${stateName.slice(0, 4)}_${frame}`,
        x + manifest.frameWidth / 2,
        y + manifest.frameHeight - 2
      );
    }
  }
  
  return canvas;
}

/**
 * Generate a placeholder spritesheet canvas for people
 */
export function generatePeoplePlaceholder(
  manifest: PeopleSpriteManifest
): HTMLCanvasElement {
  const states = Object.entries(manifest.states);
  const variants = manifest.variants || [{ name: 'default', column: 0 }];
  const framesPerState = Math.max(...states.map(([, s]) => s.frames));
  
  const cols = framesPerState * variants.length;
  const rows = states.length;
  
  const canvas = document.createElement('canvas');
  canvas.width = manifest.frameWidth * cols;
  canvas.height = manifest.frameHeight * rows;
  
  const ctx = canvas.getContext('2d')!;
  
  // Colors for variants
  const variantColors = ['#00ffff', '#ff6b9d', '#ffd93d', '#6bcb77'];
  
  for (const [stateName, stateConfig] of states) {
    const y = stateConfig.row * manifest.frameHeight;
    
    for (let variantIdx = 0; variantIdx < variants.length; variantIdx++) {
      const baseColor = variantColors[variantIdx % variantColors.length];
      
      for (let frame = 0; frame < stateConfig.frames; frame++) {
        const x = (variantIdx * framesPerState + frame) * manifest.frameWidth;
        
        // Draw person/group placeholder
        const centerX = x + manifest.frameWidth / 2;
        const centerY = y + manifest.frameHeight * 0.6;
        const radius = Math.min(manifest.frameWidth, manifest.frameHeight) * 0.3;
        
        // Body (circle)
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Head (smaller circle)
        ctx.fillStyle = '#ffe4c4';
        ctx.beginPath();
        ctx.arc(centerX, centerY - radius * 0.8, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Direction indicator
        ctx.fillStyle = '#333';
        let eyeOffsetX = 0;
        let eyeOffsetY = 0;
        
        if (stateName === 'look_down') {
          eyeOffsetY = 2;
        } else if (stateName === 'look_up') {
          eyeOffsetY = -2;
        } else if (stateName === 'look_side') {
          eyeOffsetX = 3;
        }
        
        // Eyes
        const eyeSize = 2;
        ctx.beginPath();
        ctx.arc(
          centerX - 3 + eyeOffsetX,
          centerY - radius * 0.8 + eyeOffsetY,
          eyeSize,
          0,
          Math.PI * 2
        );
        ctx.arc(
          centerX + 3 + eyeOffsetX,
          centerY - radius * 0.8 + eyeOffsetY,
          eyeSize,
          0,
          Math.PI * 2
        );
        ctx.fill();
        
        // Animation variation
        if (frame === 1) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // For groups, add more circles
        if (manifest.category !== 'individual') {
          const extraCount = manifest.category === 'small_group' ? 1 : 3;
          for (let i = 0; i < extraCount; i++) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            ctx.arc(
              centerX + (i - extraCount / 2) * radius * 0.8,
              centerY + radius * 0.5,
              radius * 0.6,
              0,
              Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }
    }
  }
  
  return canvas;
}

/**
 * Download a canvas as PNG
 */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Generate and download all placeholder spritesheets
 */
export async function generateAllPlaceholders(): Promise<void> {
  // This would be called from browser console to generate placeholders
  console.log('Generating placeholder spritesheets...');
  console.log('Run individual generators and use downloadCanvas() to save them.');
  console.log('Example:');
  console.log('  const canvas = generateEstablishmentPlaceholder(manifest);');
  console.log('  downloadCanvas(canvas, "spritesheet.png");');
}
