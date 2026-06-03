import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSupplyCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre_categoria!: string;
}
