import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplyCategoryDto } from './create-supply-category.dto';

export class UpdateSupplyCategoryDto extends PartialType(
  CreateSupplyCategoryDto,
) {}
