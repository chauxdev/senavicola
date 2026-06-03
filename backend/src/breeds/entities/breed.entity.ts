import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('raza')
export class Breed {
  @PrimaryGeneratedColumn('uuid')
  id_raza!: string;

  @Column({ length: 255 })
  nombre!: string;

  @Column({ length: 255 })
  descripcion!: string;
}
