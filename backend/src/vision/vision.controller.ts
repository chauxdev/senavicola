import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { VisionService } from './vision.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('vision')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @Get('models')
  getModels() {
    return this.visionService.getModels();
  }

  @Post('predict')
  predict(@Body() body: { modelId: string, frameBase64: string, calibration: any }) {
    return this.visionService.predict(body.modelId, body.frameBase64, body.calibration);
  }
}
