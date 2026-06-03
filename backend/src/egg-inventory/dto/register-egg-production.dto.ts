import { IsUUID, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class RegisterEggProductionDto {
  @IsUUID()
  loteId!: string;

  @IsUUID()
  tipoHuevoId!: string;

  @IsNumber()
  cantidad!: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
