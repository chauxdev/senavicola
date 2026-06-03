import { IsUUID, IsNumber } from 'class-validator';

export class RegisterDeadBirdsDto {
  @IsUUID()
  loteId!: string;

  @IsNumber()
  cantidad!: number;
}
