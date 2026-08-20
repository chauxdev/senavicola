import { Module } from '@nestjs/common';
import { VisionController } from './vision.controller';
import { VisionService } from './vision.service';
import { OpenAIVisionModel } from './models/openai.model';
import { AnthropicVisionModel } from './models/anthropic.model';
import { PythonVisionModel } from './models/python.model';
import { YoloVisionModel } from './models/yolo.model';

@Module({
  controllers: [VisionController],
  providers: [VisionService, OpenAIVisionModel, AnthropicVisionModel, PythonVisionModel, YoloVisionModel],
})
export class VisionModule {}
