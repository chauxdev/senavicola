import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSupplyDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombre?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cantidad?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stockMinimo?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  proveedor?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  precioUnitario?: number;

  @IsUUID()
  @IsOptional()
  id_categoria?: string;

  @IsUUID()
  @IsOptional()
  id_unidad_medida?: string;

  @IsDateString()
  @IsOptional()
  fecha?: string;
}
