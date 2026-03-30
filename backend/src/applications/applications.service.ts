import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { EventRole } from '../event-roles/entities/event-role.entity';
import { UserSkill } from '../user-skills/entities/user-skill.entity';
import { UsersService } from '../users/users.service';
import { EventsService } from '../events/events.service';
import { MatchingService } from '../matching/matching.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(EventRole)
    private readonly roleRepo: Repository<EventRole>,
    @InjectRepository(UserSkill)
    private readonly userSkillRepo: Repository<UserSkill>,
    private readonly usersService: UsersService,
    private readonly eventsService: EventsService,
    private readonly matchingService: MatchingService,
    private readonly gamificationService: GamificationService,
  ) {}

  async apply(authId: string, dto: CreateApplicationDto): Promise<Application> {
    const user = await this.usersService.findByAuthId(authId);
    if (!user) throw new NotFoundException('User not found');

    const role = await this.roleRepo.findOne({ where: { id: dto.role_id } });
    if (!role) throw new NotFoundException('Role not found');

    const existing = await this.appRepo.findOne({
      where: { user_id: user.id, role_id: dto.role_id },
    });
    if (existing) throw new ConflictException('You have already applied to this role');

    // Obține skill-urile voluntarului
    const userSkills = await this.userSkillRepo.find({ where: { user_id: user.id } });
    const volunteerSkillIds = userSkills.map((us) => us.skill_id);

    // Calculează scorul de potrivire (null dacă FastAPI e down)
    const matchScore = await this.matchingService.computeScore(
      volunteerSkillIds,
      role.required_skills ?? [],
    );

    const application = this.appRepo.create({
      user_id: user.id,
      role_id: dto.role_id,
      status: ApplicationStatus.PENDING,
      match_score: matchScore,
    });

    return this.appRepo.save(application) as Promise<Application>;
  }

  async findMyApplications(authId: string): Promise<Application[]> {
    const user = await this.usersService.findByAuthId(authId);
    if (!user) throw new NotFoundException('User not found');

    return this.appRepo.find({
      where: { user_id: user.id },
      relations: ['role', 'role.event'],
      order: { created_at: 'DESC' },
    });
  }

  async findEventApplications(eventId: string, authId: string): Promise<Application[]> {
    const event = await this.eventsService.findOne(eventId);
    const user = await this.usersService.findByAuthId(authId);
    if (!user || event.organizer_id !== user.id) {
      throw new ForbiddenException('Only the event organizer can view applications');
    }

    return this.appRepo
      .createQueryBuilder('app')
      .innerJoinAndSelect('app.role', 'role')
      .innerJoinAndSelect('app.user', 'user')
      .where('role.event_id = :eventId', { eventId })
      .orderBy('app.match_score', 'DESC', 'NULLS LAST')
      .addOrderBy('app.created_at', 'DESC')
      .getMany();
  }

  async updateStatus(
    applicationId: string,
    authId: string,
    dto: UpdateApplicationStatusDto,
  ): Promise<Application> {
    const application = await this.appRepo.findOne({
      where: { id: applicationId },
      relations: ['role', 'role.event'],
    });
    if (!application) throw new NotFoundException('Application not found');

    const event = await this.eventsService.findOne(application.role.event_id);
    const user = await this.usersService.findByAuthId(authId);
    if (!user || event.organizer_id !== user.id) {
      throw new ForbiddenException('Only the event organizer can update application status');
    }

    const updated = Object.assign({}, application, { status: dto.status });
    const saved = await this.appRepo.save(updated);

    // Gamification trigger: dacă aplicația e COMPLETED, acordă punctele rolului
    if (dto.status === ApplicationStatus.COMPLETED) {
      const role = await this.appRepo
        .createQueryBuilder('app')
        .innerJoinAndSelect('app.role', 'role')
        .where('app.id = :id', { id: applicationId })
        .getOne();

      const points = role?.role?.points_reward ?? 0;
      if (points > 0) {
        await this.gamificationService.awardPoints(
          application.user_id,
          points,
          `Voluntariat completat — ${role?.role?.role_name ?? 'rol'}`,
        );
      }
      await this.gamificationService.checkAndAwardBadges(application.user_id);
    }

    return saved;
  }
}
