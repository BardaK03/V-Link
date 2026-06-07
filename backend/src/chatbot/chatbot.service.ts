import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { AzureOpenAI } from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import { UsersService } from '../users/users.service';
import { UserSkill } from '../user-skills/entities/user-skill.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Event } from '../events/entities/event.entity';
import { Application } from '../applications/entities/application.entity';
import { HistoryEntryDto } from './dto/chat-message.dto';

const SYSTEM_PROMPT = `Ești asistentul virtual al platformei V-Link, o platformă care conectează organizații
cu voluntari și ajută oamenii să găsească oportunități de voluntariat potrivite.

Reguli de bază:
- Răspunde întotdeauna în limba română, pe un ton prietenos, natural și încurajator.
- Nu inventa niciodată informații despre utilizatori, evenimente sau organizații —
  obține datele reale exclusiv prin tool-urile disponibile (getUserProfile,
  getRecommendedEvents, getEventDetails, searchEvents).
- Când recomanzi un eveniment, explică pe scurt de ce se potrivește cu profilul
  utilizatorului (skill-uri, interese, istoricul lui de voluntariat).
- Dacă utilizatorul întreabă despre un eveniment anume, folosește getEventDetails
  pentru a oferi informații complete și corecte despre roluri, program și organizator.
- Dacă tool-urile nu returnează informația cerută, spune sincer că nu ai date
  disponibile în acel moment, în loc să presupui sau să inventezi.
- Fii concis și concret — evită răspunsuri lungi, formale sau repetitive.`;

const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getUserProfile',
      description: 'Returnează profilul utilizatorului curent: skill-urile sale și numărul de aplicații trimise.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getRecommendedEvents',
      description: 'Returnează lista de evenimente de voluntariat recomandate pentru utilizator, sortate după scor de potrivire cu skill-urile sale.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getEventDetails',
      description: 'Returnează detalii complete despre un eveniment: descriere, roluri disponibile, skill-uri necesare, organizator, date.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'ID-ul evenimentului' },
        },
        required: ['eventId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchEvents',
      description: 'Caută evenimente de voluntariat după un cuvânt cheie din titlu sau descriere.',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Cuvântul cheie de căutat' },
        },
        required: ['keyword'],
      },
    },
  },
];

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private client: AzureOpenAI;
  private deployment: string;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    @InjectRepository(UserSkill) private userSkillRepo: Repository<UserSkill>,
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Application) private applicationRepo: Repository<Application>,
  ) {
    const apiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY');
    const endpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT');
    const deployment = this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT');
    const apiVersion = this.configService.get<string>('AZURE_OPENAI_API_VERSION');

    if (!apiKey || !endpoint || !deployment || !apiVersion) {
      throw new Error('AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT and AZURE_OPENAI_API_VERSION must be configured');
    }

    this.deployment = deployment;
    this.client = new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion });
  }

  async chat(userId: string, message: string, history: HistoryEntryDto[]): Promise<string> {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((h): ChatCompletionMessageParam => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts,
      })),
      { role: 'user', content: message },
    ];

    let completion = await this.client.chat.completions.create({
      model: this.deployment,
      messages,
      tools: TOOLS,
    });
    let responseMessage = completion.choices[0].message;

    let iterations = 0;
    while (responseMessage.tool_calls?.length && iterations < 5) {
      iterations++;
      messages.push(responseMessage);

      const toolMessages = await Promise.all(
        responseMessage.tool_calls
          .filter((call) => call.type === 'function')
          .map(async (call): Promise<ChatCompletionMessageParam> => {
            const args = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
            const toolResult = await this.executeTool(call.function.name, args, userId);
            return {
              role: 'tool',
              tool_call_id: call.id,
              content: JSON.stringify(toolResult),
            };
          }),
      );
      messages.push(...toolMessages);

      completion = await this.client.chat.completions.create({
        model: this.deployment,
        messages,
        tools: TOOLS,
      });
      responseMessage = completion.choices[0].message;
    }

    return responseMessage.content ?? '';
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

  private async getUserProfile(authId: string) {
    const user = await this.usersService.findByAuthId(authId);
    if (!user) return { error: 'Utilizator negăsit' };

    const userSkills = await this.userSkillRepo.find({ where: { user_id: user.id } });

    const skillIds = userSkills.map((us) => us.skill_id);
    const skills = skillIds.length ? await this.skillRepo.findByIds(skillIds) : [];

    const applicationCount = await this.applicationRepo.count({ where: { user_id: user.id } });

    return {
      displayName: user.display_name,
      totalPoints: user.total_points,
      skills: skills.map((s) => s.name),
      applicationCount,
    };
  }

  private async getRecommendedEvents(authId: string) {
    const user = await this.usersService.findByAuthId(authId);
    if (!user) return { error: 'Utilizator negăsit' };

    const [userSkills, applications, events] = await Promise.all([
      this.userSkillRepo.find({ where: { user_id: user.id } }),
      this.applicationRepo.find({ where: { user_id: user.id } }),
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
