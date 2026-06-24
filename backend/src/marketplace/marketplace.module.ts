import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceItem } from './entities/marketplace-item.entity';
import { UserInventory } from './entities/user-inventory.entity';
import { UserEquippedCosmetics } from './entities/user-equipped-cosmetics.entity';
import { MarketplacePurchase } from './entities/marketplace-purchase.entity';
import { PointTransaction } from '../point-transactions/entities/point-transaction.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketplaceItem,
      UserInventory,
      UserEquippedCosmetics,
      MarketplacePurchase,
      PointTransaction,
      User,
    ]),
    UsersModule,
  ],
  providers: [MarketplaceService],
  controllers: [MarketplaceController],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
