import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseGuard } from './supabase.guard';
import { RoleGuard } from './role.guard';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [ConfigModule, UsersModule],
  controllers: [AuthController],
  providers: [SupabaseGuard, RoleGuard, AuthService],
  exports: [SupabaseGuard, RoleGuard],
})
export class AuthModule {}
