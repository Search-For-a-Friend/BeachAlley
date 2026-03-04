/**
 * Candidate Generation System for Staff Recruitment
 */

import { StaffCandidate, OccupationConfig, OCCUPATION_CONFIGS, RECRUITMENT_CONFIG } from '../types/recruitment';

// Sample data for candidate generation
const FIRST_NAMES = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 
  'James', 'Jennifer', 'William', 'Amanda', 'Richard', 'Michelle', 'Joseph', 'Jessica'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson'
];

const TRAITS = [
  'Fast Service', 'Friendly', 'Experienced', 'Reliable', 'Efficient', 
  'Customer Focus', 'Team Player', 'Detail Oriented', 'Quick Learner', 'Hard Working'
];

const AVATAR_IDS = [
  'avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6', 'avatar7', 'avatar8',
  'avatar9', 'avatar10', 'avatar11', 'avatar12', 'avatar13', 'avatar14', 'avatar15', 'avatar16'
];

export class CandidateGenerator {
  private static random = Math.random;

  static setRandomFunction(fn: () => number): void {
    this.random = fn;
  }

  /**
   * Generate a pool of candidates for a specific occupation
   */
  static generateCandidates(occupation: string, premium: boolean = false): StaffCandidate[] {
    const config = OCCUPATION_CONFIGS[occupation];
    if (!config) {
      throw new Error(`Unknown occupation: ${occupation}`);
    }

    const candidates: StaffCandidate[] = [];
    const poolSize = RECRUITMENT_CONFIG.candidatesPerPool;

    for (let i = 0; i < poolSize; i++) {
      candidates.push(this.generateCandidate(occupation, config, premium));
    }

    return candidates;
  }

  /**
   * Generate a single candidate
   */
  private static generateCandidate(occupation: string, config: OccupationConfig, premium: boolean): StaffCandidate {
    const rating = this.generateRating(config, premium);
    const experience = this.generateExperience(config, premium);
    const dailyCost = this.calculateSalary(config, rating, experience);

    return {
      id: `candidate_${Date.now()}_${Math.floor(this.random() * 10000)}`,
      name: this.generateName(),
      occupation,
      photo: this.selectAvatar(),
      dailyCost,
      experience,
      rating,
      traits: this.generateTraits(rating),
      isTemporary: false,
    };
  }

  /**
   * Generate a temporary staff member (when player skips recruitment)
   */
  static generateTemporaryStaff(occupation: string): StaffCandidate {
    const config = OCCUPATION_CONFIGS[occupation];
    if (!config) {
      throw new Error(`Unknown occupation: ${occupation}`);
    }

    const dailyCost = Math.round(config.baseSalary * RECRUITMENT_CONFIG.temporaryStaffSalaryMultiplier);

    return {
      id: `temp_${Date.now()}_${Math.floor(this.random() * 10000)}`,
      name: this.generateName(),
      occupation,
      photo: this.selectAvatar(),
      dailyCost,
      experience: Math.floor(config.minExperience + (config.maxExperience - config.minExperience) * 0.5),
      rating: RECRUITMENT_CONFIG.temporaryStaffRating,
      traits: ['Temporary Hire'],
      isTemporary: true,
    };
  }

  /**
   * Generate a random name
   */
  private static generateName(): string {
    const firstName = FIRST_NAMES[Math.floor(this.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(this.random() * LAST_NAMES.length)];
    return `${firstName} ${lastName}`;
  }

  /**
   * Select a random avatar
   */
  private static selectAvatar(): string {
    return AVATAR_IDS[Math.floor(this.random() * AVATAR_IDS.length)];
  }

  /**
   * Generate rating based on config and premium status
   */
  private static generateRating(config: OccupationConfig, premium: boolean): number {
    const minRating = premium ? Math.max(config.minRating, 3.5) : config.minRating;
    const maxRating = config.maxRating;
    
    // Premium rerolls have higher chance of exceptional candidates
    if (premium && this.random() < 0.2) {
      return 5.0; // 20% chance for perfect rating
    }

    // Generate rating with slight bias toward middle range
    const raw = this.random() * this.random(); // Squared for bias toward lower end
    const rating = minRating + (maxRating - minRating) * raw;
    
    return Math.round(rating * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Generate experience years
   */
  private static generateExperience(config: OccupationConfig, premium: boolean): number {
    const minExp = config.minExperience;
    const maxExp = config.maxExperience;
    
    // Premium candidates tend to have more experience
    const experienceMultiplier = premium ? 0.7 : 0.3;
    const experience = minExp + (maxExp - minExp) * (experienceMultiplier + this.random() * (1 - experienceMultiplier));
    
    return Math.floor(experience);
  }

  /**
   * Calculate salary based on rating and experience
   */
  private static calculateSalary(config: OccupationConfig, rating: number, experience: number): number {
    const ratingMultiplier = 0.8 + (rating / 5.0) * 0.4; // 0.8 to 1.2 based on rating
    const experienceMultiplier = 1.0 + (experience / config.maxExperience) * 0.2; // Up to 1.2 based on experience
    
    const calculatedSalary = config.baseSalary * ratingMultiplier * experienceMultiplier;
    
    // Clamp to min/max range
    const clampedSalary = Math.max(config.minSalary, Math.min(config.maxSalary, calculatedSalary));
    
    return Math.round(clampedSalary);
  }

  /**
   * Generate traits based on rating
   */
  private static generateTraits(rating: number): string[] {
    const traits: string[] = [];
    const numTraits = rating >= 4.5 ? 2 : rating >= 3.5 ? 1 : 0;
    
    for (let i = 0; i < numTraits; i++) {
      const availableTraits = TRAITS.filter(t => !traits.includes(t));
      if (availableTraits.length > 0) {
        traits.push(availableTraits[Math.floor(this.random() * availableTraits.length)]);
      }
    }
    
    return traits;
  }
}
