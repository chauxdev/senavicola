import { IsString, MinLength } from 'class-validator';

export class CreateBreedDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsString()
  descripcion!: string;
}
