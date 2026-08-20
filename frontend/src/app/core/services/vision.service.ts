import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisionModelInfo {
  id: string;
  name: string;
  isAvailable: boolean;
  statusMessage?: string;
}

export interface VisionResult {
  success: boolean;
  model: string;
  detected: string;
  weight?: number;
  confidence?: number;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class VisionApiService {
  private apiUrl = `${environment.apiUrl}/vision`;

  constructor(private http: HttpClient) {}

  getModels(): Observable<VisionModelInfo[]> {
    return this.http.get<VisionModelInfo[]>(`${this.apiUrl}/models`);
  }

  predict(modelId: string, frameBase64: string, calibration: any): Observable<VisionResult> {
    return this.http.post<VisionResult>(`${this.apiUrl}/predict`, {
      modelId,
      frameBase64,
      calibration
    });
  }
}
