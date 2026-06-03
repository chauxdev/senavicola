import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from './create-permission.dto';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}

export class AssignPermissionDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  id_rol: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  id_permiso: number;
}
