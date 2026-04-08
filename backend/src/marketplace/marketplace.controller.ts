import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { MarketplaceService } from './marketplace.service';
import { PurchaseDto } from './dto/purchase.dto';
import { EquipDto } from './dto/equip.dto';

@Controller('marketplace')
@UseGuards(SupabaseGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('items')
  listItems(@Query('category') category?: string) {
    return this.marketplaceService.listItems(category);
  }

  @Post('purchase')
  purchase(@Request() req: any, @Body() dto: PurchaseDto) {
    return this.marketplaceService.purchase(req.user.id, dto);
  }

  @Get('me/inventory')
  getInventory(@Request() req: any) {
    return this.marketplaceService.getInventory(req.user.id);
  }

  @Get('me/equipped')
  getEquipped(@Request() req: any) {
    return this.marketplaceService.getEquipped(req.user.id).then((e) => e ?? {});
  }

  @Patch('me/equip')
  equip(@Request() req: any, @Body() dto: EquipDto) {
    return this.marketplaceService.equip(req.user.id, dto);
  }
}
