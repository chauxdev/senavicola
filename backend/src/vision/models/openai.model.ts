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
    
    const apiKey = process.env.API_OPENAI || '';
    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Look at the digital scale display in this image. Return just the numeric value displayed on the screen. Do not include units like 'g' or 'kg', just the raw number. If you cannot see a clear number, return nothing." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${frameBase64}` } }
          ]
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    const detected = result.choices[0].message.content.trim();
    const parsed = parseFloat(detected.replace(/[^0-9.]/g, ''));

    return {
      success: true,
      model: this.id,
      detected,
      weight: isNaN(parsed) ? undefined : parsed
    };
  }
}
