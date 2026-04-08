import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { MarketplaceItem } from './entities/marketplace-item.entity';
import { UserInventory } from './entities/user-inventory.entity';
import { UserEquippedCosmetics } from './entities/user-equipped-cosmetics.entity';
import { MarketplacePurchase } from './entities/marketplace-purchase.entity';
import { User } from '../users/entities/user.entity';
import { PointTransaction } from '../point-transactions/entities/point-transaction.entity';
import { UsersService } from '../users/users.service';
import { PurchaseDto } from './dto/purchase.dto';
import { EquipDto } from './dto/equip.dto';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(MarketplaceItem)
    private readonly itemRepo: Repository<MarketplaceItem>,
    @InjectRepository(UserInventory)
    private readonly inventoryRepo: Repository<UserInventory>,
    @InjectRepository(UserEquippedCosmetics)
    private readonly equippedRepo: Repository<UserEquippedCosmetics>,
    @InjectRepository(MarketplacePurchase)
    private readonly purchaseRepo: Repository<MarketplacePurchase>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  listItems(category?: string): Promise<MarketplaceItem[]> {
    const where = category
      ? { category: category as MarketplaceItem['category'], is_active: true }
      : { is_active: true };
    return this.itemRepo.find({ where, order: { point_cost: 'ASC' } });
  }

  async purchase(authId: string, dto: PurchaseDto): Promise<MarketplacePurchase> {
    const user = await this.usersService.findByAuthId(authId);
    if (!user) throw new NotFoundException('User not found');

    const item = await this.itemRepo.findOne({ where: { id: dto.item_id, is_active: true } });
    if (!item) throw new NotFoundException('Item not found');

    if (item.stock !== null && item.stock <= 0) {
      throw new BadRequestException('Item out of stock');
    }

    let purchase!: MarketplacePurchase;

    await this.dataSource.transaction(async (em) => {
      // Lock user row to prevent concurrent double-spend
      const lockedUser = await em
        .createQueryBuilder(User, 'u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: user.id })
        .getOne();

      if (!lockedUser) throw new NotFoundException('User not found');
      if (lockedUser.total_points < item.point_cost) {
        throw new BadRequestException(
          `Puncte insuficiente. Ai ${lockedUser.total_points}, dar ai nevoie de ${item.point_cost}.`,
        );
      }

      // Deduct points
      await em
        .createQueryBuilder()
        .update(User)
        .set({ total_points: () => `total_points - ${item.point_cost}` })
        .where('id = :id', { id: user.id })
        .execute();

      // Record transaction
      await em.insert(PointTransaction, {
        user_id: user.id,
        amount: -item.point_cost,
        description: `Marketplace: ${item.name}`,
      });

      // Add to inventory
      await em.insert(UserInventory, {
        user_id: user.id,
        item_id: item.id,
      });

      // Decrease stock if limited
      if (item.stock !== null) {
        await em
          .createQueryBuilder()
          .update(MarketplaceItem)
          .set({ stock: () => 'stock - 1' })
          .where('id = :id', { id: item.id })
          .execute();
      }

      // Generate redemption code for perks
      const redemptionCode =
        item.category === 'PERK'
          ? `VL-${randomBytes(6).toString('hex').toUpperCase()}`
          : null;

      purchase = await em.save(
        em.create(MarketplacePurchase, {
          user_id: user.id,
          item_id: item.id,
          point_cost: item.point_cost,
          status: 'COMPLETED',
          redemption_code: redemptionCode,
        }),
      );
    });

    return purchase;
  }

  async getInventory(authId: string): Promise<UserInventory[]> {
    const user = await this.usersService.findByAuthId(authId);
    if (!user) throw new NotFoundException('User not found');
    return this.inventoryRepo.find({
      where: { user_id: user.id },
      relations: ['item'],
      order: { acquired_at: 'DESC' },
    });
  }

  async getEquipped(userId: string): Promise<UserEquippedCosmetics | null> {
    return this.equippedRepo.findOne({ where: { user_id: userId } });
  }

  async equip(authId: string, dto: EquipDto): Promise<UserEquippedCosmetics> {
    const user = await this.usersService.findByAuthId(authId);
    if (!user) throw new NotFoundException('User not found');

    // Validate ownership of each non-null item
    const itemIds = [
      dto.name_color_item_id,
      dto.name_animation_item_id,
      dto.avatar_frame_item_id,
      dto.glow_item_id,
    ].filter((id): id is number => id != null);

    for (const itemId of itemIds) {
      const owned = await this.inventoryRepo.findOne({
        where: { user_id: user.id, item_id: itemId },
      });
      if (!owned) {
        throw new BadRequestException(
          `Item ${itemId} nu se află în inventarul tău`,
        );
      }
    }

    const existing = await this.equippedRepo.findOne({ where: { user_id: user.id } });

    type EquipIdFields = {
      user_id: string;
      name_color_item_id?: number | null;
      name_animation_item_id?: number | null;
      avatar_frame_item_id?: number | null;
      glow_item_id?: number | null;
    };

    const updated: EquipIdFields = { user_id: user.id };
    if (dto.name_color_item_id !== undefined)
      updated.name_color_item_id = dto.name_color_item_id ?? null;
    if (dto.name_animation_item_id !== undefined)
      updated.name_animation_item_id = dto.name_animation_item_id ?? null;
    if (dto.avatar_frame_item_id !== undefined)
      updated.avatar_frame_item_id = dto.avatar_frame_item_id ?? null;
    if (dto.glow_item_id !== undefined)
      updated.glow_item_id = dto.glow_item_id ?? null;

    if (existing) {
      const { user_id: _uid, ...fieldsToUpdate } = updated;
      await this.equippedRepo
        .createQueryBuilder()
        .update(UserEquippedCosmetics)
        .set(fieldsToUpdate as any)
        .where('user_id = :uid', { uid: user.id })
        .execute();
    } else {
      await this.equippedRepo
        .createQueryBuilder()
        .insert()
        .into(UserEquippedCosmetics)
        .values(updated as any)
        .execute();
    }

    return this.equippedRepo.findOne({ where: { user_id: user.id } }) as Promise<UserEquippedCosmetics>;
  }

  async getEquippedForUsers(
    userIds: string[],
  ): Promise<Map<string, UserEquippedCosmetics>> {
    if (userIds.length === 0) return new Map();

    const rows = await this.equippedRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.name_color_item', 'nc')
      .leftJoinAndSelect('e.name_animation_item', 'na')
      .leftJoinAndSelect('e.avatar_frame_item', 'af')
      .leftJoinAndSelect('e.glow_item', 'gl')
      .whereInIds(userIds.map((id) => ({ user_id: id })))
      .getMany();

    return new Map(rows.map((r) => [r.user_id, r]));
  }
}
