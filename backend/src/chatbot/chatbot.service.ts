import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { GoogleGenerativeAI, Tool, SchemaType } from '@google/generative-ai';
import { User } from '../users/entities/user.entity';
import { UserSkill } from '../user-skills/entities/user-skill.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Event } from '../events/entities/event.entity';
import { Application } from '../applications/entities/application.entity';
import { HistoryEntryDto } from './dto/chat-message.dto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserSkill) private userSkillRepo: Repository<UserSkill>,
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Application) private applicationRepo: Repository<Application>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chat(userId: string, message: string, history: HistoryEntryDto[]): Promise<string> {
    const tools: Tool[] = [
      {
        functionDeclarations: [
          {
            name: 'getUserProfile',
            description: 'Returnează profilul utilizatorului curent: skill-urile sale și numărul de aplicații trimise.',
            parameters: { type: SchemaType.OBJECT, properties: {}, required: [] },
          },
          {
            name: 'getRecommendedEvents',
            description: 'Returnează lista de evenimente de voluntariat recomandate pentru utilizator, sortate după scor de potrivire cu skill-urile sale.',
            parameters: { type: SchemaType.OBJECT, properties: {}, required: [] },
          },
          {
            name: 'getEventDetails',
            description: 'Returnează detalii complete despre un eveniment: descriere, roluri disponibile, skill-uri necesare, organizator, date.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                eventId: { type: SchemaType.STRING, description: 'ID-ul evenimentului' },
              },
              required: ['eventId'],
            },
          },
          {
            name: 'searchEvents',
            description: 'Caută evenimente de voluntariat după un cuvânt cheie din titlu sau descriere.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                keyword: { type: SchemaType.STRING, description: 'Cuvântul cheie de căutat' },
              },
              required: ['keyword'],
            },
          },
        ],
      },
    ];

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `Ești un asistent inteligent pentru platforma V-Link, o platformă de voluntariat.
Ajuți voluntarii să găsească oportunități de voluntariat potrivite pentru skill-urile și interesele lor.
Răspunzi în română, pe un ton prietenos și util.
Când recomanzi evenimente, explică de ce se potrivesc cu profilul utilizatorului.
Nu inventa informații — folosește întotdeauna tool-urile disponibile pentru a accesa date reale.
Dacă utilizatorul întreabă despre un voluntariat specific, folosește getEventDetails pentru detalii complete.`,
      tools,
    });

    const geminiHistory = history.map((h) => ({
      role: h.role,
      parts: [{ text: h.parts }],
    }));

    const chatSession = model.startChat({ history: geminiHistory });

    let result = await chatSession.sendMessage(message);
    let response = result.response;

    let iterations = 0;
    while (response.functionCalls()?.length && iterations < 5) {
      iterations++;
      const calls = response.functionCalls()!;

      const functionResponses = await Promise.all(
        calls.map(async (call) => {
          const toolResult = await this.executeTool(call.name, call.args as Record<string, unknown>, userId);
          return {
            functionResponse: {
              name: call.name,
              response: { result: toolResult },
            },
          };
        }),
      );

      result = await chatSession.sendMessage(functionResponses);
      response = result.response;
    }

    return response.text();
  }

  private async executeTool(name: string, args: Record<string, unknown>, userId: string): Promise<unknown> {
    switch (name) {
      case 'getUserProfile':
        return this.getUserProfile(userId);
      case 'getRecommendedEvents':
        return this.getRecommendedEvents(userId);
      case 'getEventDetails':
        return this.getEventDetails(args.eventId as string);
      case 'searchEvents':
        return this.searchEvents(args.keyword as string);
      default:
        return { error: `Tool necunoscut: ${name}` };
    }
  }

  private async getUserProfile(userId: string) {
    const [user, userSkills] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.userSkillRepo.find({ where: { user_id: userId } }),
    ]);

    if (!user) return { error: 'Utilizator negăsit' };

    const skillIds = userSkills.map((us) => us.skill_id);
    const skills = skillIds.length ? await this.skillRepo.findByIds(skillIds) : [];

    const applicationCount = await this.applicationRepo.count({ where: { user_id: userId } });

    return {
      displayName: user.display_name,
      totalPoints: user.total_points,
      skills: skills.map((s) => s.name),
      applicationCount,
    };
  }

  private async getRecommendedEvents(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return { error: 'Utilizator negăsit' };

    const [userSkills, applications, events] = await Promise.all([
      this.userSkillRepo.find({ where: { user_id: userId } }),
      this.applicationRepo.find({ where: { user_id: userId } }),
      this.eventRepo.find({
        where: { status: 'ACTIVE', registration_status: 'OPEN' },
        relations: ['roles', 'organizer'],
        take: 50,
      }),
    ]);

    const userSkillIds = new Set(userSkills.map((us) => us.skill_id));
    const appliedRoleIds = new Set(applications.map((a) => a.role_id));

    const skillIds = [...userSkillIds];
    const skillNames = skillIds.length
      ? (await this.skillRepo.findByIds(skillIds)).map((s) => s.name)
      : [];

    const scored = events
      .filter((ev) => {
        if (!ev.roles?.length) return true;
        return !ev.roles.every((r) => appliedRoleIds.has(r.id));
      })
      .map((ev) => {
        const score = this.calculateSkillScore(ev.roles, userSkillIds);
        return {
          id: ev.id,
          title: ev.title,
          address: ev.address,
          startDate: ev.start_date,
          endDate: ev.end_date,
          organizer: ev.organizer?.company_name || ev.organizer?.display_name || 'Organizator necunoscut',
          matchScore: Math.min(100, Math.round(score)),
          roles: ev.roles?.map((r) => r.role_name) || [],
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return { userSkills: skillNames, recommendedEvents: scored };
  }

  private async getEventDetails(eventId: string) {
    if (!eventId) return { error: 'eventId lipsă' };

    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['roles', 'organizer'],
    });

    if (!event) return { error: 'Eveniment negăsit' };

    const roleSkillIds = (event.roles || []).flatMap((r) => r.required_skills || []);
    const uniqueSkillIds = [...new Set(roleSkillIds)];
    const skills = uniqueSkillIds.length ? await this.skillRepo.findByIds(uniqueSkillIds) : [];
    const skillMap = new Map(skills.map((s) => [s.id, s.name]));

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      address: event.address,
      startDate: event.start_date,
      endDate: event.end_date,
      registrationDeadline: event.registration_deadline,
      registrationStatus: event.registration_status,
      organizer: {
        name: event.organizer?.company_name || event.organizer?.display_name,
        email: event.organizer?.email,
      },
      roles: (event.roles || []).map((r) => ({
        name: r.role_name,
        description: r.description,
        slotsNeeded: r.slots_needed,
        hoursRequired: r.hours_required,
        pointsReward: r.points_reward,
        requiredSkills: (r.required_skills || []).map((id) => skillMap.get(id) || String(id)),
      })),
    };
  }

  private async searchEvents(keyword: string) {
    if (!keyword) return { error: 'keyword lipsă' };

    const events = await this.eventRepo.find({
      where: [
        { title: ILike(`%${keyword}%`), status: 'ACTIVE' },
        { description: ILike(`%${keyword}%`), status: 'ACTIVE' },
      ],
      relations: ['organizer'],
      take: 10,
    });

    return {
      results: events.map((ev) => ({
        id: ev.id,
        title: ev.title,
        address: ev.address,
        startDate: ev.start_date,
        registrationStatus: ev.registration_status,
        organizer: ev.organizer?.company_name || ev.organizer?.display_name,
      })),
    };
  }

  private calculateSkillScore(roles: Event['roles'], userSkillIds: Set<number>): number {
    if (!roles?.length) return 50;
    const withSkills = roles.filter((r) => r.required_skills?.length);
    if (!withSkills.length) return 50;

    const scores = withSkills.map((r) => {
      const matched = r.required_skills.filter((id) => userSkillIds.has(id)).length;
      return (matched / r.required_skills.length) * 100;
    });
    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }
}
