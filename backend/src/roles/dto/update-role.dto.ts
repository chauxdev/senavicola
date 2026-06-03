import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class AssignRoleDto {
  @IsUUID()
  @IsNotEmpty()
  id_usuario: string;

  @IsNotEmpty()
  id_rol: number;
}
