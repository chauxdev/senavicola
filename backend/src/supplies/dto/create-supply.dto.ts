import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSupplyDto {
  @IsInt()
  @IsPositive()
  id_categoria!: number;

  @IsInt()
  @IsPositive()
  id_unidad_medida!: number;

  @IsInt()
  @IsPositive()
  id_llamar_usuario!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsNumber()
  @Min(0)
  cantidad!: number;

  @IsDateString()
  fecha!: string;
}
