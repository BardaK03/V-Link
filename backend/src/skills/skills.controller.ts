import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';

@Controller('skills')
export class SkillsController {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
  ) {}

  @Get()
  findAll(): Promise<Skill[]> {
    return this.skillRepo.find({ order: { name: 'ASC' } });
  }
}
