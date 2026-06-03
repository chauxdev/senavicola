import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  IsUUID,
  IsInt,
} from 'class-validator';

export class CreateSupplyHistoryDto {
  @IsUUID()
  id_insumos!: string;

  @IsInt()
  @IsPositive()
  id_historial_accion!: string;

  @IsNumber()
  @IsPositive()
  cantidad!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  descripcion!: string;

  @IsDateString()
  fecha!: string;
}
