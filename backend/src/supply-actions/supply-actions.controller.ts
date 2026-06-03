import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SupplyActionsService } from './supply-actions.service';
import { CreateSupplyActionDto } from './dto/create-supply-action.dto';
import { UpdateSupplyActionDto } from './dto/update-supply-action.dto';

@Controller('supply-actions')
export class SupplyActionsController {
  constructor(private readonly supplyActionsService: SupplyActionsService) {}

  @Post()
  create(@Body() dto: CreateSupplyActionDto) {
    return this.supplyActionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.supplyActionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplyActionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplyActionDto) {
    return this.supplyActionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supplyActionsService.remove(id);
  }
}
