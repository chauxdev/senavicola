import { IsUUID, IsNumber } from 'class-validator';

export class CreateEggHistoryDto {
  @IsUUID()
  inventarioId!: string;

  @IsUUID()
  produccionId!: string;

  @IsUUID()
  usuarioId!: string;

  @IsNumber()
  cantidad!: number;
}
