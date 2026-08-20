import { Injectable } from '@nestjs/common';
import { VisionModelProvider, VisionResult } from '../interfaces/vision-model.interface';

@Injectable()
export class YoloVisionModel implements VisionModelProvider {
  id = 'yolo';
  name = 'YOLO';

  isAvailable(): boolean {
    return !!process.env.YOLO_MODEL_URL;
  }

  async predict(frameBase64: string, calibration: any): Promise<VisionResult> {
    if (!this.isAvailable()) throw new Error('YOLO no configurado');
    throw new Error('No implementado todavía');
  }
}
