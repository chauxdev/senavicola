import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplyActionDto } from './create-supply-action.dto';

export class UpdateSupplyActionDto extends PartialType(CreateSupplyActionDto) {}
