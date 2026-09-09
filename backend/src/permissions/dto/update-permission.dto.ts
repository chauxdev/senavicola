import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from './create-permission.dto';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}

export class AssignPermissionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  id_rol: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  id_permiso: number;
}
