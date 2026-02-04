import {
  Establishment,
  EstablishmentState,
  STATE_THRESHOLDS,
  STATE_ATTRACTION_MULTIPLIERS,
  Vector2,
} from '../types';
import { generateId } from './utils';

/**
 * Create a new establishment
 */
export function createEstablishment(
  position: Vector2,
  options: Partial<Establishment> = {}
): Establishment {
  return {
    id: generateId(),
    position,
    maxCapacity: options.maxCapacity ?? 10,
    currentOccupancy: 0,
    state: 'deserted',
    isOpen: true,
    attractionRadius: options.attractionRadius ?? 250,
    attractionPower: options.attractionPower ?? 70,
    serviceTime: options.serviceTime ?? 8000,
    totalVisitors: 0,
    totalRevenue: 0,
    ...options,
  };
}

/**
 * Calculate the establishment state based on occupancy
 */
export function calculateEstablishmentState(establishment: Establishment): EstablishmentState {
  if (!establishment.isOpen) return 'closed';
  if (establishment.currentOccupancy === 0) return 'deserted';
  
  const occupancyPercent = (establishment.currentOccupancy / establishment.maxCapacity) * 100;
  
  if (occupancyPercent >= STATE_THRESHOLDS.crowded) return 'crowded';
  if (occupancyPercent >= STATE_THRESHOLDS.busy) return 'busy';
  if (occupancyPercent >= STATE_THRESHOLDS.visited) return 'visited';
  
  return 'deserted';
}

/**
 * Update establishment state and return if it changed
 */
export function updateEstablishmentState(establishment: Establishment): {
  changed: boolean;
  previousState: EstablishmentState;
} {
  const previousState = establishment.state;
  const newState = calculateEstablishmentState(establishment);
  
  if (newState !== previousState) {
    establishment.state = newState;
    return { changed: true, previousState };
  }
  
  return { changed: false, previousState };
}

/**
 * Get the current attraction multiplier for an establishment
 */
export function getAttractionMultiplier(establishment: Establishment): number {
  return STATE_ATTRACTION_MULTIPLIERS[establishment.state];
}

/**
 * Check if establishment has capacity for a group
 */
export function hasCapacity(establishment: Establishment, groupSize: number): boolean {
  return establishment.currentOccupancy + groupSize <= establishment.maxCapacity;
}

/**
 * Add occupants to establishment
 */
export function addOccupants(establishment: Establishment, count: number): void {
  establishment.currentOccupancy += count;
  establishment.totalVisitors += count;
}

/**
 * Remove occupants from establishment
 */
export function removeOccupants(establishment: Establishment, count: number): void {
  establishment.currentOccupancy = Math.max(0, establishment.currentOccupancy - count);
}

/**
 * Add revenue to establishment
 */
export function addRevenue(establishment: Establishment, amount: number): void {
  establishment.totalRevenue += amount;
}

/**
 * Get state color for rendering
 */
export function getStateColor(state: EstablishmentState): string {
  const colors: Record<EstablishmentState, string> = {
    closed: '#4a4a4a',
    deserted: '#6b7280',
    visited: '#22c55e',
    busy: '#f59e0b',
    crowded: '#ef4444',
  };
  return colors[state];
}

/**
 * Get state emoji for display
 */
export function getStateEmoji(state: EstablishmentState): string {
  const emojis: Record<EstablishmentState, string> = {
    closed: '🔒',
    deserted: '🏚️',
    visited: '🏠',
    busy: '🏡',
    crowded: '🔥',
  };
  return emojis[state];
}
