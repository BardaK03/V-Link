import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // ConfigModule pentru a citi variabilele din .env
    ConfigModule.forRoot({
      isGlobal: true, // Face ConfigService disponibil global
      envFilePath: '.env',
    }),

    // TypeORM configuration folosind ConfigService
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

    // Feature modules
    UsersModule,
  ],
})
export class AppModule {}
