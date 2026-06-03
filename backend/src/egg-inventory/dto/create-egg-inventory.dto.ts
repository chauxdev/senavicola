import { IsUUID, IsNumber } from 'class-validator';

export class CreateEggProductionDto {
  @IsUUID()
  loteId!: string;

  @IsUUID()
  tipoHuevoId!: string;

  @IsNumber()
  cantidad!: number;
}
