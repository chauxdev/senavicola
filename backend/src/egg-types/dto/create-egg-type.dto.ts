import { IsNumber, IsString } from 'class-validator';

export class CreateEggTypeDto {
  @IsString()
  tipo!: string;

  @IsNumber()
  peso_min!: number;

  @IsNumber()
  peso_max!: number;
}
