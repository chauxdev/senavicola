import { Injectable, NotFoundException } from '@nestjs/common';
import { OpenAIVisionModel } from './models/openai.model';
import { AnthropicVisionModel } from './models/anthropic.model';
import { PythonVisionModel } from './models/python.model';
import { VisionModelProvider, VisionResult } from './interfaces/vision-model.interface';

@Injectable()
export class VisionService {
  private models: Map<string, VisionModelProvider> = new Map();

  constructor(
    private openai: OpenAIVisionModel,
    private anthropic: AnthropicVisionModel,
    private python: PythonVisionModel
  ) {
    this.models.set(this.python.id, this.python);
    this.models.set(this.openai.id, this.openai);
    this.models.set(this.anthropic.id, this.anthropic);
  }

  getModels() {
    const list: any[] = [];
    for (const model of this.models.values()) {
      list.push({
        id: model.id,
        name: model.name,
        isAvailable: model.isAvailable()
      });
    }
    return list;
  }

  async predict(modelId: string, frameBase64: string, calibration: any): Promise<VisionResult> {
    const model = this.models.get(modelId);
    if (!model) throw new NotFoundException(`Modelo ${modelId} no encontrado`);
    if (!model.isAvailable()) {
      return { success: false, model: model.id, detected: '', message: `El modelo ${model.name} no está configurado.` };
    }
    try {
      return await model.predict(frameBase64, calibration);
    } catch (e: any) {
      return { success: false, model: model.id, detected: '', message: e.message || 'Error desconocido' };
    }
  }
}
