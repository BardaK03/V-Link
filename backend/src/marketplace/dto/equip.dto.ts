import { IsInt, IsOptional, Min } from 'class-validator';

export class EquipDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  name_color_item_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  name_animation_item_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  avatar_frame_item_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  glow_item_id?: number | null;
}
