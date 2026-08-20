export interface VisionResult {
  success: boolean;
  model: string;
  detected: string;
  weight?: number;
  confidence?: number;
  message?: string;
  metadata?: any;
}

export interface VisionModelProvider {
  id: string;
  name: string;
  isAvailable(): boolean;
  predict(frameBase64: string, calibration: any): Promise<VisionResult>;
}
