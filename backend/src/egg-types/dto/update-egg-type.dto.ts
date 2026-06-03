import { PartialType } from '@nestjs/mapped-types';
import { CreateEggTypeDto } from './create-egg-type.dto';

export class UpdateEggTypeDto extends PartialType(CreateEggTypeDto) {}
