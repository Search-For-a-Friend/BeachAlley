import {
  Establishment,
  EstablishmentState,
  STATE_THRESHOLDS,
  STATE_ATTRACTION_MULTIPLIERS,
  Vector2,
} from '../types';
import { generateId } from './utils';

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
    buildingType: options.buildingType ?? 'unknown',
    staffIds: options.staffIds ?? [],
    dailyStaffCost: options.dailyStaffCost ?? 0,
    ...options,
  };
}

export function calculateEstablishmentState(establishment: Establishment): EstablishmentState {
  if (!establishment.isOpen) return 'closed';
  if (establishment.currentOccupancy === 0) return 'deserted';
  const occupancyPercent = (establishment.currentOccupancy / establishment.maxCapacity) * 100;
  if (occupancyPercent >= STATE_THRESHOLDS.crowded) return 'crowded';
  if (occupancyPercent >= STATE_THRESHOLDS.busy) return 'busy';
  if (occupancyPercent >= STATE_THRESHOLDS.visited) return 'visited';
  return 'deserted';
}

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

export function getAttractionMultiplier(establishment: Establishment): number {
  return STATE_ATTRACTION_MULTIPLIERS[establishment.state];
}

export function hasCapacity(establishment: Establishment, groupSize: number): boolean {
  return establishment.currentOccupancy + groupSize <= establishment.maxCapacity;
}

export function addOccupants(establishment: Establishment, count: number): void {
  establishment.currentOccupancy += count;
  establishment.totalVisitors += count;
}

export function removeOccupants(establishment: Establishment, count: number): void {
  establishment.currentOccupancy = Math.max(0, establishment.currentOccupancy - count);
}

export function addRevenue(establishment: Establishment, amount: number): void {
  establishment.totalRevenue += amount;
}
