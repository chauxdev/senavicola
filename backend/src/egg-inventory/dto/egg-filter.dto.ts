import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class EggFilterDto extends PaginationDto {
  @IsString()
  @IsOptional()
  tipo?: string;
}
