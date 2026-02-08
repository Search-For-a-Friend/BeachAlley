// Input handler for mouse/touch drag interactions

import { Vector2D } from '../types/canvas';

export type InputCallback = (deltaX: number, deltaY: number) => void;
export type ElementClickCallback = (x: number, y: number) => void;
export type ElementHoverCallback = (x: number, y: number) => void;

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private isDragging = false;
  private lastPosition: Vector2D | null = null;
  private onDragCallback: InputCallback | null = null;
  private onElementClickCallback: ElementClickCallback | null = null;
  private onElementHoverCallback: ElementHoverCallback | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  setOnDrag(callback: InputCallback): void {
    this.onDragCallback = callback;
  }

  setOnElementClick(callback: ElementClickCallback): void {
    this.onElementClickCallback = callback;
  }

  setOnElementHover(callback: ElementHoverCallback): void {
    this.onElementHoverCallback = callback;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.handleTouchMove);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleMouseDown = (e: MouseEvent): void => {
    // Check if this is a drag or click
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // If we have element callbacks, call them first
    if (this.onElementClickCallback) {
      this.onElementClickCallback(x, y);
    }
    
    // Always start drag for camera movement
    this.isDragging = true;
    this.lastPosition = { x: e.clientX, y: e.clientY };
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Handle hover
    if (this.onElementHoverCallback) {
      this.onElementHoverCallback(x, y);
    }
    
    // Handle drag
    if (!this.isDragging || !this.lastPosition) return;
    const currentPosition = { x: e.clientX, y: e.clientY };
    const deltaX = currentPosition.x - this.lastPosition.x;
    const deltaY = currentPosition.y - this.lastPosition.y;
    if (this.onDragCallback) {
      this.onDragCallback(deltaX, deltaY);
    }
    this.lastPosition = currentPosition;
  };

  private handleMouseUp = (): void => {
    this.isDragging = false;
    this.lastPosition = null;
  };

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Handle element click
      if (this.onElementClickCallback) {
        this.onElementClickCallback(x, y);
      }
      
      this.isDragging = true;
      this.lastPosition = { x: touch.clientX, y: touch.clientY };
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.isDragging || !this.lastPosition || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Handle hover
    if (this.onElementHoverCallback) {
      this.onElementHoverCallback(x, y);
    }
    
    // Handle drag
    const currentPosition = { x: touch.clientX, y: touch.clientY };
    const deltaX = currentPosition.x - this.lastPosition.x;
    const deltaY = currentPosition.y - this.lastPosition.y;
    if (this.onDragCallback) this.onDragCallback(-deltaX, -deltaY);
    this.lastPosition = currentPosition;
  };

  private handleTouchEnd = (): void => {
    this.isDragging = false;
    this.lastPosition = null;
  };

  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
  }
}
