import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { EventRolesModule } from './event-roles/event-roles.module';
import { ApplicationsModule } from './applications/applications.module';
import { GamificationModule } from './gamification/gamification.module';
import { VolunteerLogsModule } from './volunteer-logs/volunteer-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

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
  ],
})
export class AppModule {}
