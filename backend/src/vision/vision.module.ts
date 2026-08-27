import { Module } from '@nestjs/common';
import { VisionController } from './vision.controller';
import { VisionService } from './vision.service';
import { OpenAIVisionModel } from './models/openai.model';
import { AnthropicVisionModel } from './models/anthropic.model';
import { PythonVisionModel } from './models/python.model';

@Module({
  controllers: [VisionController],
  providers: [VisionService, OpenAIVisionModel, AnthropicVisionModel, PythonVisionModel],
})
export class VisionModule {}
