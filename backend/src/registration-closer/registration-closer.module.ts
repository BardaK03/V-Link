import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { RegistrationCloserService } from './registration-closer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  providers: [RegistrationCloserService],
})
export class RegistrationCloserModule {}
