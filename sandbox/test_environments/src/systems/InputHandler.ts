// Input handler for mouse/touch drag interactions

import { Vector2D } from '../types/canvas';

export type InputCallback = (deltaX: number, deltaY: number) => void;

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private isDragging: boolean = false;
  private lastPosition: Vector2D | null = null;
  private onDragCallback: InputCallback | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  setOnDrag(callback: InputCallback): void {
    this.onDragCallback = callback;
  }

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);

    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.handleTouchMove);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd);

    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleMouseDown = (e: MouseEvent): void => {
    this.isDragging = true;
    this.lastPosition = { x: e.clientX, y: e.clientY };
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging || !this.lastPosition) return;

    const currentPosition = { x: e.clientX, y: e.clientY };
    const deltaX = currentPosition.x - this.lastPosition.x;
    const deltaY = currentPosition.y - this.lastPosition.y;

    if (this.onDragCallback) {
      this.onDragCallback(-deltaX, -deltaY); // Invert for natural dragging
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
      this.isDragging = true;
      this.lastPosition = { x: touch.clientX, y: touch.clientY };
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.isDragging || !this.lastPosition || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const currentPosition = { x: touch.clientX, y: touch.clientY };
    const deltaX = currentPosition.x - this.lastPosition.x;
    const deltaY = currentPosition.y - this.lastPosition.y;

    if (this.onDragCallback) {
      this.onDragCallback(-deltaX, -deltaY); // Invert for natural dragging
    }

    this.lastPosition = currentPosition;
  };

  private handleTouchEnd = (): void => {
    this.isDragging = false;
    this.lastPosition = null;
  };

  destroy(): void {
    // Remove all event listeners
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
