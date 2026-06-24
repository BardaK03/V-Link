import { Injectable } from '@nestjs/common';

@Injectable()
export class MatchingService {
  computeScore(volunteerSkills: number[], roleSkills: number[]): number {
    const roleSet = new Set(roleSkills);

    if (roleSet.size === 0) return 100;

    const volunteerSet = new Set(volunteerSkills);
    const intersection = volunteerSkills.filter((s) => roleSet.has(s)).length;
    const union = new Set([...volunteerSet, ...roleSet]).size;

    return Math.round((intersection / union) * 100);
  }
}