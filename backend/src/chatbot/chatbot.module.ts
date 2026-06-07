import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';
import { UserSkill } from '../user-skills/entities/user-skill.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Event } from '../events/entities/event.entity';
import { EventRole } from '../event-roles/entities/event-role.entity';
import { Application } from '../applications/entities/application.entity';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([User, UserSkill, Skill, Event, EventRole, Application]),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
