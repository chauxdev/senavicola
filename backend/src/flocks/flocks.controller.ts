import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';

import { FlocksService } from './flocks.service';
import { CreateFlockDto } from './dto/create-flock.dto';
import { UpdateFlockDto } from './dto/update-flock.dto';
import { RegisterDeadBirdsDto } from './dto/register-dead-birds.dto';
import { FinishFlockDto } from './dto/finish-flock.dto';
import { AssignFlockDto } from './dto/assign-flock.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('flocks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FlocksController {
  constructor(private readonly flocksService: FlocksService) {}

  @Post()
  @RequirePermission('LOTES_CREAR')
  create(@Body() dto: CreateFlockDto, @GetUser() user: any) {
    const userDisplayName = user ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Sistema';
    return this.flocksService.create(dto, userDisplayName);
  }

  @Get()
  @RequirePermission('LOTES_VER')
  findAll(@Query() paginationDto: PaginationDto) {
    return this.flocksService.findAll(paginationDto);
  }

  @Get('historial')
  @RequirePermission('LOTES_VER')
  findAllHistory(@Query() query: PaginationDto & { loteId?: string }) {
    return this.flocksService.findAllHistory(query);
  }

  @Get(':id')
  @RequirePermission('LOTES_VER')
  findOne(@Param('id') id: string) {
    return this.flocksService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('LOTES_EDITAR')
  update(@Param('id') id: string, @Body() dto: UpdateFlockDto, @GetUser() user: any) {
    const userDisplayName = user ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Sistema';
    return this.flocksService.update(id, dto, userDisplayName);
  }

  @Post('asignar')
  @RequirePermission('LOTES_EDITAR')
  assignFlock(@Body() dto: AssignFlockDto, @GetUser() user: any) {
    const userDisplayName = user ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Sistema';
    return this.flocksService.assignFlock(dto, userDisplayName);
  }

  @Post('aves-muertas')
  @RequirePermission('LOTES_EDITAR')
  registerDeadBirds(@Body() dto: RegisterDeadBirdsDto) {
    return this.flocksService.registerDeadBirds(dto);
  }

  @Post('finalizar')
  @RequirePermission('LOTES_EDITAR')
  finishFlock(@Body() dto: FinishFlockDto) {
    return this.flocksService.finishFlock(dto);
  }
}
