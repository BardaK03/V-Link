import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserSkill } from '../user-skills/entities/user-skill.entity';
import { Skill } from '../skills/entities/skill.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSkill)
    private readonly userSkillRepository: Repository<UserSkill>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByAuthId(auth_id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { auth_id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async updateSocialLinks(
    auth_id: string,
    social_links: Record<string, string>,
  ): Promise<User> {
    const user = await this.findByAuthId(auth_id);
    if (!user) throw new NotFoundException('User not found');
    await this.userRepository.update(user.id, { social_links });
    return { ...user, social_links };
  }

  async getSkills(auth_id: string): Promise<Skill[]> {
    const user = await this.findByAuthId(auth_id);
    if (!user) throw new NotFoundException('User not found');
    const userSkills = await this.userSkillRepository.find({
      where: { user_id: user.id },
      relations: ['skill'],
    });
    return userSkills.map((us) => us.skill);
  }

  async addSkill(auth_id: string, skill_id: number): Promise<void> {
    const user = await this.findByAuthId(auth_id);
    if (!user) throw new NotFoundException('User not found');
    const skill = await this.skillRepository.findOne({ where: { id: skill_id } });
    if (!skill) throw new NotFoundException('Skill not found');
    const exists = await this.userSkillRepository.findOne({
      where: { user_id: user.id, skill_id },
    });
    if (!exists) {
      await this.userSkillRepository.save({ user_id: user.id, skill_id });
    }
  }

  async removeSkill(auth_id: string, skill_id: number): Promise<void> {
    const user = await this.findByAuthId(auth_id);
    if (!user) throw new NotFoundException('User not found');
    await this.userSkillRepository.delete({ user_id: user.id, skill_id });
  }

  async updateProfile(auth_id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findByAuthId(auth_id);
    if (!user) throw new NotFoundException('User not found');
    const updated = {
      ...user,
      display_name: dto.display_name !== undefined ? dto.display_name : user.display_name,
      company_name: dto.company_name !== undefined ? dto.company_name : user.company_name,
      avatar_url: dto.avatar_url !== undefined ? dto.avatar_url : user.avatar_url,
    };
    return this.userRepository.save(updated);
  }
}
