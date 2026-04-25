import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { EventRolesModule } from './event-roles/event-roles.module';
import { ApplicationsModule } from './applications/applications.module';
import { GamificationModule } from './gamification/gamification.module';
import { VolunteerLogsModule } from './volunteer-logs/volunteer-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SkillsModule } from './skills/skills.module';
import { OrganizationReviewsModule } from './organization-reviews/organization-reviews.module';
import { AdminModule } from './admin/admin.module';
import { RegistrationCloserModule } from './registration-closer/registration-closer.module';
import { ShiftsModule } from './shifts/shifts.module';
import { CalendarModule } from './calendar/calendar.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { FeedModule } from './feed/feed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
        ssl: { rejectUnauthorized: false },
      }),
      inject: [ConfigService],
    }),

    UsersModule,
    AuthModule,
    EventsModule,
    EventRolesModule,
    ApplicationsModule,
    GamificationModule,
    VolunteerLogsModule,
    NotificationsModule,
    SkillsModule,
    OrganizationReviewsModule,
    AdminModule,
    RegistrationCloserModule,
    ShiftsModule,
    CalendarModule,
    MarketplaceModule,
    FeedModule,
  ],
})
export class AppModule {}
