import { IsArray, IsString, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class HistoryEntryDto {
  @IsIn(['user', 'model'])
  role: 'user' | 'model';

  @IsString()
  parts: string;
}

export class ChatMessageDto {
  @IsString()
  message: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryEntryDto)
  history: HistoryEntryDto[];
}
