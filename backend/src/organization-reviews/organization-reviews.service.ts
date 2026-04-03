import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationReview } from './entities/organization-review.entity';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { UsersService } from '../users/users.service';
import { EventsService } from '../events/events.service';
import { UserRole } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class OrganizationReviewsService {
  constructor(
    @InjectRepository(OrganizationReview)
    private readonly reviewRepo: Repository<OrganizationReview>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    private readonly usersService: UsersService,
    private readonly eventsService: EventsService,
  ) {}

  async createReview(
    authId: string,
    organizationId: string,
    dto: CreateReviewDto,
  ): Promise<OrganizationReview> {
    const reviewer = await this.usersService.findByAuthId(authId);
    if (!reviewer) throw new NotFoundException('User not found');
    if (reviewer.role !== UserRole.VOLUNTEER) {
      throw new ForbiddenException('Doar voluntarii pot lăsa recenzii');
    }

    const organization = await this.usersService.findById(organizationId);
    if (!organization || organization.role !== UserRole.ORGANIZER) {
      throw new NotFoundException('Organizația nu a fost găsită');
    }

    // Verify volunteer has completed an application for an event by this organization
    const completedApp = await this.appRepo
      .createQueryBuilder('app')
      .innerJoin('app.role', 'role')
      .innerJoin('role.event', 'event')
      .where('app.user_id = :userId', { userId: reviewer.id })
      .andWhere('event.organizer_id = :organizerId', { organizerId: organizationId })
      .andWhere('app.role_id IN (SELECT er.id FROM event_roles er WHERE er.event_id = :eventId)', { eventId: dto.event_id })
      .andWhere('app.status = :status', { status: ApplicationStatus.COMPLETED })
      .getOne();

    if (!completedApp) {
      throw new BadRequestException(
        'Poți lăsa o recenzie doar dacă ai completat un eveniment al acestei organizații',
      );
    }

    const existing = await this.reviewRepo.findOne({
      where: { reviewer_id: reviewer.id, organization_id: organizationId, event_id: dto.event_id },
    });
    if (existing) throw new ConflictException('Ai lăsat deja o recenzie pentru acest eveniment');

    const review = this.reviewRepo.create({
      reviewer_id: reviewer.id,
      organization_id: organizationId,
      event_id: dto.event_id,
      rating: dto.rating,
      comment: dto.comment ?? null,
      photo_url: dto.photo_url ?? null,
    });

    return this.reviewRepo.save(review);
  }

  async getReviewsForOrganization(organizationId: string): Promise<OrganizationReview[]> {
    return this.reviewRepo.find({
      where: { organization_id: organizationId },
      relations: ['reviewer', 'event'],
      order: { created_at: 'DESC' },
    });
  }

  async getReviewsSummary(organizationId: string): Promise<{ average_rating: number; total: number }> {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'total')
      .where('r.organization_id = :organizationId', { organizationId })
      .getRawOne<{ avg: string; total: string }>();

    return {
      average_rating: result?.avg ? parseFloat(result.avg) : 0,
      total: result?.total ? parseInt(result.total) : 0,
    };
  }

  async getEligibleEvents(authId: string, organizationId: string): Promise<{ event_id: string; event_title: string }[]> {
    const reviewer = await this.usersService.findByAuthId(authId);
    if (!reviewer) return [];

    // Events where volunteer has COMPLETED status and hasn't reviewed yet
    const completedApps = await this.appRepo
      .createQueryBuilder('app')
      .innerJoin('app.role', 'role')
      .innerJoin('role.event', 'event')
      .where('app.user_id = :userId', { userId: reviewer.id })
      .andWhere('event.organizer_id = :organizerId', { organizerId: organizationId })
      .andWhere('app.status = :status', { status: ApplicationStatus.COMPLETED })
      .select(['event.id', 'event.title'])
      .distinct(true)
      .getRawMany<{ event_id: string; event_title: string }>();

    // Filter out already reviewed events
    const reviewedEventIds = await this.reviewRepo
      .find({ where: { reviewer_id: reviewer.id, organization_id: organizationId } })
      .then((reviews) => new Set(reviews.map((r) => r.event_id)));

    return completedApps.filter((app) => !reviewedEventIds.has(app.event_id));
  }
}
