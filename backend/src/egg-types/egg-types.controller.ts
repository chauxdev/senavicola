import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EggTypesService } from './egg-types.service';
import { CreateEggTypeDto } from './dto/create-egg-type.dto';
import { UpdateEggTypeDto } from './dto/update-egg-type.dto';

@Controller('egg-types')
export class EggTypesController {
  constructor(private readonly eggTypesService: EggTypesService) {}

  @Post()
  create(@Body() createEggTypeDto: CreateEggTypeDto) {
    return this.eggTypesService.create(createEggTypeDto);
  }

  @Get()
  findAll() {
    return this.eggTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eggTypesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEggTypeDto: UpdateEggTypeDto) {
    return this.eggTypesService.update(id, updateEggTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eggTypesService.remove(id);
  }
}
