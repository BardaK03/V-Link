import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationReview } from './entities/organization-review.entity';
import { Application } from '../applications/entities/application.entity';
import { OrganizationReviewsService } from './organization-reviews.service';
import { OrganizationReviewsController } from './organization-reviews.controller';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationReview, Application]),
    UsersModule,
    EventsModule,
    AuthModule,
  ],
  providers: [OrganizationReviewsService],
  controllers: [OrganizationReviewsController],
})
export class OrganizationReviewsModule {}
