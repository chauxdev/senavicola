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
    // Using actual video resolution
    canvas.width = this.videoElement.videoWidth || 640;
    canvas.height = this.videoElement.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener el contexto 2D');
    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8).replace(/^data:image\/jpeg;base64,/, '');
  }
}
