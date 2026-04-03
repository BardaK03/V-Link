import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { OrganizationReviewsService } from './organization-reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('organizations')
@UseGuards(SupabaseGuard)
export class OrganizationReviewsController {
  constructor(private readonly reviewsService: OrganizationReviewsService) {}

  @Post(':orgId/reviews')
  createReview(
    @Param('orgId') orgId: string,
    @Request() req: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(req.user.id, orgId, dto);
  }

  @Get(':orgId/reviews')
  getReviews(@Param('orgId') orgId: string) {
    return this.reviewsService.getReviewsForOrganization(orgId);
  }

  @Get(':orgId/reviews/summary')
  getSummary(@Param('orgId') orgId: string) {
    return this.reviewsService.getReviewsSummary(orgId);
  }

  @Get(':orgId/reviews/eligibility')
  getEligibility(@Param('orgId') orgId: string, @Request() req: any) {
    return this.reviewsService.getEligibleEvents(req.user.id, orgId);
  }
}
