import { IsInt, Min } from 'class-validator';

export class PurchaseDto {
  @IsInt()
  @Min(1)
  item_id: number;
}
