import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { SupplyHistoryService } from './supply-history.service';
import { CreateSupplyHistoryDto } from './dto/create-supply-history.dto';
import { UpdateSupplyHistoryDto } from './dto/update-supply-history.dto';

@Controller('supply-history')
export class SupplyHistoryController {
  constructor(private readonly supplyHistoryService: SupplyHistoryService) {}

  @Post()
  create(@Body() dto: CreateSupplyHistoryDto) {
    return this.supplyHistoryService.create(dto);
  }

  @Get()
  findAll() {
    return this.supplyHistoryService.findAll();
  }

  /**
   * Obtener historial de movimientos de un insumo específico
   * GET /supply-history/by-supply/:idInsumo
   */
  @Get('by-supply/:idInsumo')
  findByInsumo(@Param('idInsumo') idInsumo: string) {
    return this.supplyHistoryService.findByInsumo(idInsumo);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplyHistoryService.findOne(id);
  }
}
