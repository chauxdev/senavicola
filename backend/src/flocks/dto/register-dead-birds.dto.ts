import { IsUUID, IsNumber, IsOptional, IsDateString, IsString } from 'class-validator';

export class RegisterDeadBirdsDto {
  @IsUUID()
  loteId!: string;

  @IsNumber()
  cantidad!: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}
