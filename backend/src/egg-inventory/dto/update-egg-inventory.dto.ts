import { IsUUID, IsNumber, IsOptional } from 'class-validator';

export class UpdateEggInventoryDto {
  @IsUUID()
  @IsOptional()
  loteId?: string;

  @IsUUID()
  @IsOptional()
  tipoHuevoId?: string;

  @IsNumber()
  @IsOptional()
  cantidad?: number;
}
