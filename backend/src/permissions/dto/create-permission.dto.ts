import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreatePermissionDto {
  @IsInt()
  @Min(1)
  codigo!: number;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;
}
