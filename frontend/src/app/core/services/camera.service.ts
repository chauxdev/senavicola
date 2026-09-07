import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface CameraCalibration {
  roi: { x: number; y: number; width: number; height: number };
  cameraHeight: number;
  rotation?: number;
  flip?: boolean;
  block_size?: number;
  c_value?: number;
  clahe_clip?: number;
  shear_angle?: number;
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
    return { 
      roi: { x: 213, y: 348, width: 71, height: 52 },
      cameraHeight: 45,
      block_size: 35,
      c_value: 15,
      clahe_clip: 3.0,
      shear_angle: 0
    };
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

  getFrameInfo(): { base64: string; width: number; height: number } {
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
    
    ctx.save();
    
    // Configurar transformaciones desde el centro
    ctx.translate(width / 2, height / 2);
    
    if (this.currentCalibration.rotation === 180) {
      ctx.rotate(Math.PI);
    }
    
    if (this.currentCalibration.flip) {
      ctx.scale(-1, 1);
    }
    
    // Dibujar la imagen centrada
    ctx.drawImage(this.videoElement, -width / 2, -height / 2, width, height);
    ctx.restore();
    
    // Use PNG to avoid chroma subsampling artifacts that ruin green digit segmentation
    return {
      base64: canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''),
      width: width,
      height: height
    };
  }

  getFrameBase64(): string {
    return this.getFrameInfo().base64;
  }
}
