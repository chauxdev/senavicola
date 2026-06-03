import { IsUUID, IsNumber, IsString } from 'class-validator';

export class RegisterDamagedEggsDto {
  @IsUUID()
  inventarioId!: string;

  @IsNumber()
  cantidad!: number;

  @IsString()
  razon!: string;
}
