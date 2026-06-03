import { IsUUID, IsNumber, IsString } from 'class-validator';

export class FinishFlockDto {
  @IsUUID()
  loteId!: string;

  @IsNumber()
  cantidad!: number;

  @IsString()
  razon!: string;
}
