import { Injectable } from '@nestjs/common';
import { VisionModelProvider, VisionResult } from '../interfaces/vision-model.interface';

@Injectable()
export class PythonVisionModel implements VisionModelProvider {
  id = 'python';
  name = 'Modelo propio Python';

  isAvailable(): boolean {
    return !!process.env.PYTHON_MODEL_URL;
  }

  async predict(frameBase64: string, calibration: any): Promise<VisionResult> {
    if (!this.isAvailable()) throw new Error('Modelo Python no configurado');
    throw new Error('No implementado todavía');
  }
}
