import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseGuard } from '../auth/supabase.guard';
import { FeedService } from './feed.service';

@UseGuards(SupabaseGuard)
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getRecommendations(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const authId = (req as any).user.id;
    return this.feedService.getRecommendations(
      authId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
