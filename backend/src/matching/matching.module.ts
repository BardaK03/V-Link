import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MatchingService } from './matching.service';

@Module({
  imports: [HttpModule],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
