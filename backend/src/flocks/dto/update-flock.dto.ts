import { PartialType } from '@nestjs/mapped-types';
import { CreateFlockDto } from './create-flock.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateFlockDto extends PartialType(CreateFlockDto) {
  @IsString()
  @IsOptional()
  estado?: string;
}
