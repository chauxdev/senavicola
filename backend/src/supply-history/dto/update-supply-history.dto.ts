import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplyHistoryDto } from './create-supply-history.dto';

export class UpdateSupplyHistoryDto extends PartialType(
  CreateSupplyHistoryDto,
) {}
