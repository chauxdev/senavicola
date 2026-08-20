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
    
    const apiKey = process.env.API_ANTHROPIC || '';
    const body = {
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 50,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: frameBase64 }
            },
            { type: "text", text: "Look at the digital scale display in this image. Return just the numeric value displayed on the screen. Do not include units like 'g' or 'kg', just the raw number. If you cannot see a clear number, return nothing." }
          ]
        }
      ]
    };

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
    const parsed = parseFloat(detected.replace(/[^0-9.]/g, ''));

    return {
      success: true,
      model: this.id,
      detected,
      weight: isNaN(parsed) ? undefined : parsed
    };
  }
}
