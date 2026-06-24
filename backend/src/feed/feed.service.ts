import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserSkill } from '../user-skills/entities/user-skill.entity';
import { Event } from '../events/entities/event.entity';
import { EventRole } from '../event-roles/entities/event-role.entity';
import { Application } from '../applications/entities/application.entity';
import { VolunteerLog } from '../volunteer-logs/entities/volunteer-log.entity';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserSkill)
    private readonly userSkillRepo: Repository<UserSkill>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(VolunteerLog)
    private readonly volunteerLogRepo: Repository<VolunteerLog>,
  ) {}

  async getRecommendations(authId: string, page = 1, limit = 10) {
    const user = await this.userRepo.findOne({ where: { auth_id: authId } });
    if (!user) return { events: [], total: 0, page, limit };

    const [userSkills, userApplications, logs, allEvents] = await Promise.all([
      this.userSkillRepo.find({ where: { user_id: user.id } }),
      this.applicationRepo.find({ where: { user_id: user.id } }),
      this.volunteerLogRepo.find({ where: { user_id: user.id }, relations: ['event'] }),
      this.eventRepo.find({
        where: { status: 'ACTIVE', registration_status: 'OPEN' },
        relations: ['roles', 'organizer'],
      }),
    ]);

    const userSkillIds = new Set(userSkills.map((us) => us.skill_id));
    const appliedRoleIds = new Set(userApplications.map((a) => a.role_id));
    const pastOrgIds = new Set(
      logs.filter((l) => l.event).map((l) => l.event.organizer_id),
    );

    const filteredEvents = allEvents.filter((event) => {
      if (!event.roles || event.roles.length === 0) return true;
      const eventRoleIds = event.roles.map((r) => r.id);
      return !eventRoleIds.every((rid) => appliedRoleIds.has(rid));
    });

    const scored = filteredEvents.map((event) => {
      const skillScore = this.calculateSkillScore(event.roles, userSkillIds);
      const orgBonus = pastOrgIds.has(event.organizer_id) ? 20 : 0;
      const matchScore = Math.min(100, Math.round(skillScore + orgBonus));

      return {
        id: event.id,
        title: event.title,
        address: event.address,
        start_date: event.start_date,
        end_date: event.end_date,
        status: event.status,
        registration_status: event.registration_status,
        match_score: matchScore,
        roles: (event.roles || []).map((r: EventRole) => ({
          id: r.id,
          role_name: r.role_name,
          slots_needed: r.slots_needed,
          required_skills: r.required_skills || [],
        })),
        organizer: {
          id: event.organizer.id,
          display_name: event.organizer.display_name,
          company_name: event.organizer.company_name,
          avatar_url: event.organizer.avatar_url,
        },
      };
    });

    scored.sort((a, b) => b.match_score - a.match_score);

    const total = scored.length;
    const start = (page - 1) * limit;
    const paginated = scored.slice(start, start + limit);

    return { events: paginated, total, page, limit };
  }

  private calculateSkillScore(roles: EventRole[], userSkillIds: Set<number>): number {
    if (!roles || roles.length === 0) return 50;

    const rolesWithSkills = roles.filter(
      (r) => r.required_skills && r.required_skills.length > 0,
    );
    if (rolesWithSkills.length === 0) return 50;

    const scores = rolesWithSkills.map((role) => {
      const matched = role.required_skills.filter((sid) => userSkillIds.has(sid)).length;
      return (matched / role.required_skills.length) * 100;
    });

    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }
}
