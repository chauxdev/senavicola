import { IsUUID, IsNumber } from 'class-validator';

export class CreateFeedingDto {
  @IsUUID()
  id_usuario!: string;

  @IsUUID()
  id_lote!: string;

  @IsUUID()
  id_insumo!: string;

  @IsNumber()
  cantidad!: number;
}
