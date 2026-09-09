import { Injectable } from '@nestjs/common';
import { VisionModelProvider, VisionResult } from '../interfaces/vision-model.interface';

@Injectable()
export class AnthropicVisionModel implements VisionModelProvider {
  id = 'anthropic';
  name = 'Anthropic';

  isAvailable(): boolean {
    return !!process.env.API_ANTHROPIC;
  }

  async predict(frameBase64: string, calibration: any): Promise<VisionResult> {
    if (!this.isAvailable()) throw new Error('Anthropic no configurado');
    
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

    const apiKey = process.env.API_ANTHROPIC || '';
    const body = {
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: frameBase64 }
            },
            { type: "text", text: promptText }
          ]
        }
      ]
    };

    const startTime = Date.now();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    const detected = result.content[0].text.trim();
    
    let parsedData: any = {};
    let weight: number | undefined = undefined;
    
    try {
      // Clean up potential markdown from Anthropic response just in case
      let cleanJson = detected;
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace('```json', '');
      if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace('```', '');
      cleanJson = cleanJson.replace(/```$/, '').trim();
      
      parsedData = JSON.parse(cleanJson);
      weight = parsedData.peso_g;
      
      if (result.usage) {
        const inputTokens = result.usage.input_tokens || 0;
        const outputTokens = result.usage.output_tokens || 0;
        // Costo para Claude 3.5 Sonnet: $3.00/1M input, $15.00/1M output
        const costUSD = (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0;

        parsedData.token_metrics = {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          tiempo_procesamiento_ms: Date.now() - startTime,
          costo_estimado_usd: Number(costUSD.toFixed(6))
        };
      }
    } catch (e) {
      console.error('Error parsing JSON from Anthropic', e);
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
