import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
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

  @IsInt()
  @IsOptional()
  id_categoria?: number;

  @IsInt()
  @IsOptional()
  id_unidad_medida?: number;

  @IsDateString()
  @IsOptional()
  fecha?: string;
}
