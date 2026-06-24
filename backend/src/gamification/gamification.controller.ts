import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { UsersService } from '../users/users.service';
import { GamificationService } from './gamification.service';

@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly usersService: UsersService,
  ) {}

  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit?: string) {
    return this.gamificationService.getLeaderboard(limit ? parseInt(limit, 10) : 50);
  }

  @Get('my-stats')
  @UseGuards(SupabaseGuard)
  async getMyStats(@Request() req: any) {
    const user = await this.usersService.findByAuthId(req.user.id);
    if (!user) return { total_points: 0, total_hours: 0, events_completed: 0, badges: [], recent_transactions: [] };
    return this.gamificationService.getUserStats(user.id);
  }
}
