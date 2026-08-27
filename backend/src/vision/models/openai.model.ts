import { Injectable } from '@nestjs/common';
import { VisionModelProvider, VisionResult } from '../interfaces/vision-model.interface';

@Injectable()
export class OpenAIVisionModel implements VisionModelProvider {
  id = 'openai';
  name = 'OpenAI';

  isAvailable(): boolean {
    return !!process.env.API_OPENAI;
  }

  async predict(frameBase64: string, calibration: any): Promise<VisionResult> {
    if (!this.isAvailable()) throw new Error('OpenAI no configurado');
    
    const promptText = `Actúa como un sistema de visión artificial especializado en metrología y OCR. Analiza la imagen proporcionada, que contiene una báscula con pantalla LCD de 7 segmentos y un huevo sobre ella, con una cuadrícula de referencia (5x5mm por cuadro) visible.
Debes:
1. Detectar el peso mostrado en la pantalla LCD de la gramera en gramos.
2. Identificar el huevo y usar la cuadrícula de referencia para estimar sus dimensiones físicas reales: longitud (mm), ancho (mm) y área proyectada (mm2).
3. Estimar el volumen (cm3) asumiendo una aproximación geométrica de elipsoide (donde el alto es igual al ancho).
4. Asignar una clasificación: Jumbo (>78g), AAA (>=67g), AA (>=60g), A (>=53g), B (>=46g), C (<46g).
Devuelve el resultado ESTRICTAMENTE en formato JSON con la siguiente estructura, sin comillas invertidas (backticks) ni texto markdown ni explicaciones adicionales:
{
  "peso_g": 0.0,
  "longitud_mm": 0.0,
  "ancho_mm": 0.0,
  "alto_estimado_mm": 0.0,
  "area_mm2": 0.0,
  "volumen_estimado_cm3": 0.0,
  "categoria": "AAA",
  "confianza_peso": 0.98,
  "confianza_huevo": 0.95
}`;

    const apiKey = process.env.API_OPENAI || '';
    const body = {
      model: "gpt-5.6-terra",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${frameBase64}` } }
          ]
        }
      ],
      max_completion_tokens: 300,
      temperature: 1,
      response_format: { type: "json_object" }
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    const detected = result.choices[0].message.content.trim();
    
    let parsedData: any = {};
    let weight: number | undefined = undefined;
    
    try {
      parsedData = JSON.parse(detected);
      weight = parsedData.peso_g;
    } catch (e) {
      console.error('Error parsing JSON from OpenAI', e);
    }

    return {
      success: true,
      model: this.id,
      detected,
      weight: (weight === undefined || isNaN(weight)) ? undefined : weight,
      metadata: parsedData
    };
  }
}
