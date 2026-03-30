import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private readonly matchingUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.matchingUrl =
      this.configService.get<string>('MATCHING_SERVICE_URL') ?? 'http://localhost:8000';
  }

  async computeScore(volunteerSkills: number[], roleSkills: number[]): Promise<number | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<{ score: number }>(`${this.matchingUrl}/match`, {
          volunteer_skills: volunteerSkills,
          role_skills: roleSkills,
        }),
      );
      return data.score;
    } catch (error) {
      // Degradare grațioasă: dacă FastAPI e down, scorul rămâne null
      this.logger.warn(`Matching service unavailable: ${(error as Error).message}`);
      return null;
    }
  }
}