import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { EggInventory } from './egg-inventory.entity';

@Entity('huevo_dañado')
export class DamagedEgg {
  @PrimaryGeneratedColumn('uuid')
  id_huevo_dañado!: string;

  @ManyToOne(() => EggInventory, (inventory) => inventory.damagedEggs)
  inventario!: EggInventory;

  @Column()
  cantidad!: number;

  @Column()
  razon!: string;

  @CreateDateColumn()
  registeredAt!: Date;
}
