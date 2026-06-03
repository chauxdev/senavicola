import { IsUUID, IsString } from 'class-validator';

export class CreateReportDto {
  @IsUUID()
  id_usuario!: string;

  @IsString()
  tipo_reporte!: string;
}
