import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSupplyDto {
  @IsUUID()
  id_categoria!: string;

  @IsUUID()
  id_unidad_medida!: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  id_llamar_usuario?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsNumber()
  @Min(0)
  cantidad!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockMinimo?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  proveedor?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precioUnitario?: number;

  @IsDateString()
  fecha!: string;
}
