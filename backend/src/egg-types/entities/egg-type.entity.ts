import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipo_huevo')
export class EggType {
  @PrimaryGeneratedColumn('uuid')
  id_tipo!: string;

  @Column({ length: 255 })
  tipo!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  peso_min!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  peso_max!: number | null;
}
