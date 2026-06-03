import { IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateFlockDto {
  @IsString()
  nombre!: string;

  @IsNumber()
  total_aves!: number;

  @IsUUID()
  razaId!: string;

  @IsString()
  observacion!: string;

  @IsString()
  racion_alimento!: string;

  @IsUUID()
  galponId!: string;
}
