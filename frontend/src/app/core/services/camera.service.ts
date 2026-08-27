import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface CameraCalibration {
  roi: { x: number; y: number; width: number; height: number };
  cameraHeight: number;
}

export type CameraStatus = 'conectado' | 'desconectado' | 'error';

@Injectable({ providedIn: 'root' })
export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  
  public cameraStatus = new Subject<CameraStatus>();
  public currentCalibration: CameraCalibration = this.loadCalibration();

  loadCalibration(): CameraCalibration {
    const saved = localStorage.getItem('senavicola_camera_calib');
    if (saved) return JSON.parse(saved);
    return { roi: { x: 50, y: 50, width: 200, height: 100 }, cameraHeight: 45 };
  }

  saveCalibration(calib: CameraCalibration) {
    this.currentCalibration = calib;
    localStorage.setItem('senavicola_camera_calib', JSON.stringify(calib));
  }

  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'videoinput');
    } catch (e) {
      console.error('Error al enumerar dispositivos:', e);
      return [];
    }
  }

  async initializeCamera(deviceId?: string, videoEl?: HTMLVideoElement): Promise<void> {
    try {
      if (this.stream) this.stopCamera();
      const constraints: MediaStreamConstraints = {
        video: deviceId && !deviceId.startsWith('camara_') ? { deviceId: { exact: deviceId } } : true
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoEl) {
        this.videoElement = videoEl;
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
      }
      this.cameraStatus.next('conectado');
    } catch (err: any) {
      console.error('Error al inicializar la cámara:', err);
      this.cameraStatus.next('error');
      let msg = 'Error desconocido al acceder a la cámara';
      if (err.name === 'NotAllowedError') msg = 'Permiso denegado para usar la cámara.';
      if (err.name === 'NotFoundError') msg = 'No se encontró ninguna cámara.';
      if (err.name === 'NotReadableError') msg = 'La cámara está siendo utilizada por otro programa.';
      throw new Error(msg);
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    this.cameraStatus.next('desconectado');
  }

  getFrameBase64(): string {
    if (!this.videoElement || !this.stream) throw new Error('Cámara no inicializada');
    const canvas = document.createElement('canvas');
    let width = this.videoElement.videoWidth || 640;
    let height = this.videoElement.videoHeight || 480;

    // Optimización de resolución para reducir latencia (Máximo 800px)
    const MAX_DIM = 800;
    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      } else {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener el contexto 2D');
    ctx.drawImage(this.videoElement, 0, 0, width, height);
    
    // Reducir calidad a 70% para aligerar la carga de red (base64)
    return canvas.toDataURL('image/jpeg', 0.7).replace(/^data:image\/jpeg;base64,/, '');
  }
}
