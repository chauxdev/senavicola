import { IsUUID, IsNumber } from 'class-validator';

export class AssignFlockDto {
  @IsUUID()
  galponId!: string;

  @IsUUID()
  loteId!: string;

  @IsNumber()
  cantidad!: number;
}
