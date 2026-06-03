import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMeasurementUnitDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  abreviatura!: string;
}
