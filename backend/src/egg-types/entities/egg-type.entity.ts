import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipo_huevo')
export class EggType {
  @PrimaryGeneratedColumn('uuid')
  id_tipo!: string;

  @Column({ length: 255 })
  tipo!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  peso_min!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  peso_max!: number;
}
