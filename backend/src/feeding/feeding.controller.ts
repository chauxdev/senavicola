import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { FeedingService } from './feeding.service';
import { CreateFeedingDto } from './dto/create-feeding.dto';

@Controller('alimentacion')
export class FeedingController {
  constructor(private readonly service: FeedingService) {}

  @Post()
  create(@Body() dto: CreateFeedingDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
