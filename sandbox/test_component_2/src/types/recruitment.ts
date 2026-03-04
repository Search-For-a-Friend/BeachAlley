/**
 * Staff Recruitment System Types
 */

export interface StaffCandidate {
  id: string;
  name: string;
  occupation: string;
  photo: string; // avatar URL/identifier
  dailyCost: number;
  experience: number; // years
  rating: number; // 1-5 stars
  traits: string[]; // optional bonuses
  isTemporary: boolean;
}

export interface RecruitmentState {
  establishmentId: string;
  currentPosition: number;
  totalPositions: number;
  currentOccupation: string;
  candidates: StaffCandidate[];
  freeRerollsUsed: number;
  isOpen: boolean;
}

export interface RecruitmentConfig {
  freeRerollsPerPosition: number;
  premiumRerollCost: number;
  candidatesPerPool: number;
  temporaryStaffRating: number;
  temporaryStaffSalaryMultiplier: number;
}

export const RECRUITMENT_CONFIG: RecruitmentConfig = {
  freeRerollsPerPosition: 1,
  premiumRerollCost: 50,
  candidatesPerPool: 3,
  temporaryStaffRating: 3.0,
  temporaryStaffSalaryMultiplier: 1.1,
};

export interface OccupationConfig {
  baseSalary: number;
  minSalary: number;
  maxSalary: number;
  minExperience: number;
  maxExperience: number;
  minRating: number;
  maxRating: number;
}

export const OCCUPATION_CONFIGS: Record<string, OccupationConfig> = {
  'Bartender': {
    baseSalary: 80,
    minSalary: 60,
    maxSalary: 120,
    minExperience: 0,
    maxExperience: 15,
    minRating: 2.0,
    maxRating: 5.0,
  },
  'Waiter': {
    baseSalary: 70,
    minSalary: 50,
    maxSalary: 100,
    minExperience: 0,
    maxExperience: 12,
    minRating: 2.5,
    maxRating: 5.0,
  },
  'Chef': {
    baseSalary: 100,
    minSalary: 80,
    maxSalary: 150,
    minExperience: 2,
    maxExperience: 20,
    minRating: 3.0,
    maxRating: 5.0,
  },
  'Shopkeeper': {
    baseSalary: 75,
    minSalary: 55,
    maxSalary: 110,
    minExperience: 0,
    maxExperience: 14,
    minRating: 2.5,
    maxRating: 5.0,
  },
  'Manager': {
    baseSalary: 120,
    minSalary: 90,
    maxSalary: 180,
    minExperience: 5,
    maxExperience: 25,
    minRating: 3.5,
    maxRating: 5.0,
  },
};
