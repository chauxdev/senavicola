import { Injectable, Logger } from '@nestjs/common';
import { VisionModelProvider, VisionResult } from '../interfaces/vision-model.interface';

@Injectable()
export class PythonVisionModel implements VisionModelProvider {
  id = 'python';
  name = 'Modelo propio Python';
  private readonly logger = new Logger(PythonVisionModel.name);

  isAvailable(): boolean {
    return !!process.env.PYTHON_MODEL_URL;
  }

  async predict(frameBase64: string, calibration: any): Promise<VisionResult> {
    if (!this.isAvailable()) throw new Error('Modelo Python no configurado');
    const modelUrl = process.env.PYTHON_MODEL_URL as string;
    
    try {
      // 1. Llamar a vision-peso
      let pesoValue: number | undefined = undefined;
      let rawText = '';
      
      try {
        const formData = new FormData();
        const base64Data = frameBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        formData.append('file', blob, 'frame.jpg');

        const pesoConfigUrl = 'http://vision-peso:8000/configurar-roi';
        if (calibration && calibration.roi) {
          await fetch(pesoConfigUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              x: Math.round(calibration.roi.x), 
              y: Math.round(calibration.roi.y),
              w: Math.round(calibration.roi.width),
              h: Math.round(calibration.roi.height)
            })
          });
        }

        const pesoUrl = 'http://vision-peso:8000/reconocer';
        const pesoRes = await fetch(pesoUrl, {
          method: 'POST',
          body: formData
        });
        
        if (pesoRes.ok) {
          const pData = await pesoRes.json();
          pesoValue = pData.peso;
          rawText = pData.raw;
          this.logger.log(`Raw peso from vision-peso: '${rawText}'`);
        } else {
          this.logger.error(`Error en vision-peso: ${pesoRes.status}`);
        }
      } catch (e) {
        this.logger.error(`Excepción en vision-peso: ${e.message}`);
      }

      // 2. Llamar a vision-volumen
      let metadata: any = {};
      try {
        const volUrl = 'http://vision-volumen:8020/detectar-vivo';
        const volRes = await fetch(volUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frame: frameBase64,
            peso_g: pesoValue || -1
          })
        });

        if (volRes.ok) {
          metadata = await volRes.json();
        } else {
          this.logger.error(`Error en vision-volumen: ${volRes.status}`);
        }
      } catch (e) {
        this.logger.error(`Excepción en vision-volumen: ${e.message}`);
      }

      return {
        success: true,
        model: this.id,
        detected: pesoValue !== undefined && pesoValue !== null ? `${pesoValue}g` : 'No detectado',
        weight: pesoValue,
        confidence: pesoValue !== undefined && pesoValue !== null ? 1.0 : 0.0,
        metadata: metadata
      };
    } catch (error) {
      this.logger.error(`Error llamando a Python API: ${error.message}`);
      return {
        success: false,
        model: this.id,
        detected: '',
        message: error.message
      };
    }
  }
}
