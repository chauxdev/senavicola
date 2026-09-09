"""
api.py
------
API local (FastAPI) que carga el modelo entrenado (digit_model.pth) y expone
un endpoint para reconocer el peso mostrado en la bascula a partir de una foto.

Corre 100% local, sin internet: WPF le habla por http://127.0.0.1:8000

USO:
    uvicorn api:app --host 127.0.0.1 --port 8000

    (dejar esta terminal abierta mientras uses el sistema; luego, cuando
    empaquetemos con PyInstaller, esto se vuelve un .exe que arranca solo)

CONFIGURACION:
    Ajusta las constantes ROI_X, ROI_Y, ROI_W, ROI_H y SLOTS mas abajo segun
    la calibracion que ya hiciste con capturar_digitos.py (el area que
    seleccionaste con 's'). Si cambias la posicion de la camara, tendras
    que recalibrar y actualizar estos valores.

ENDPOINT PRINCIPAL:
    POST /reconocer
        Body: form-data con un campo "file" (la imagen jpg/png del frame
        completo de la camara, igual que capturas con capturar_digitos.py)
        Respuesta: {"peso": 45, "raw": "45"}
        Si no se detecta ningun digito valido: {"peso": null, "raw": ""}
"""

import io
import json
import numpy as np
import cv2
import torch
import torch.nn as nn
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ---------- CONFIGURACION ----------
ROI_CONFIG_FILE = "roi_config.json"
with open(ROI_CONFIG_FILE, "r") as f:
    _roi = json.load(f)
ROI_X, ROI_Y, ROI_W, ROI_H = _roi
SLOTS = 2
IMG_SIZE = 32
MODEL_PATH = "digit_model.pth"
LABELS_PATH = "labels.json"
# ------------------------------------------------------------------


# ---------- Modelo (misma arquitectura que en entrenar_modelo.py) ----------
class DigitCNN(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 16, 3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(16, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(32 * 8 * 8, 64),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(64, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


def preprocesar(gray_crop):
    """Debe ser IDENTICO al preprocesamiento usado en capturar_digitos.py
    para entrenar el modelo, si no, el modelo recibe imagenes distintas
    a las que aprendio."""
    h, w = gray_crop.shape[:2]
    margen = max(1, int(w * 0.10))
    gray_crop = gray_crop.copy()
    gray_crop[0:max(1, int(h*0.15)), w-margen:w] = int(np.median(gray_crop))

    clahe = cv2.createCLAHE(clipLimit=1.0, tileGridSize=(4, 4))
    eq = clahe.apply(gray_crop)
    blur = cv2.GaussianBlur(eq, (5, 5), 0)
    th = cv2.adaptiveThreshold(
        blur, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        21, 10
    )

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(th, connectivity=8)
    limpio = np.zeros_like(th)
    area_minima = 12
    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if area >= area_minima:
            limpio[labels == i] = 255

    kernel = np.ones((2, 2), np.uint8)
    limpio = cv2.morphologyEx(limpio, cv2.MORPH_CLOSE, kernel)
    return limpio


# ---------- Carga del modelo al iniciar la API ----------
with open(LABELS_PATH, "r") as f:
    CLASSES = json.load(f)  # ej: ['0','1',...,'9','blank']

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = DigitCNN(num_classes=len(CLASSES))
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.to(device)
model.eval()

print(f"Modelo cargado. Clases: {CLASSES}")


def predecir_digito(slot_gray):
    """Recibe un recorte en escala de grises de UNA posicion y devuelve la etiqueta predicha."""
    proc = preprocesar(slot_gray)
    pil_img = Image.fromarray(proc).resize((IMG_SIZE, IMG_SIZE))
    tensor = torch.from_numpy(np.array(pil_img)).float() / 255.0
    tensor = tensor.unsqueeze(0).unsqueeze(0).to(device)  # (1,1,H,W)

    with torch.no_grad():
        output = model(tensor)
        pred_idx = output.argmax(dim=1).item()

    return CLASSES[pred_idx]


# ---------- API ----------
app = FastAPI(title="Reconocimiento de peso - Bascula")

class ROIPosicion(BaseModel):
    x: int
    y: int
    w: int
    h: int

@app.get("/roi-actual")
def roi_actual():
    return {"x": ROI_X, "y": ROI_Y, "w": ROI_W, "h": ROI_H}

@app.post("/configurar-roi")
def configurar_roi(pos: ROIPosicion):
    global ROI_X, ROI_Y, ROI_W, ROI_H
    ROI_X, ROI_Y, ROI_W, ROI_H = pos.x, pos.y, pos.w, pos.h
    with open(ROI_CONFIG_FILE, "w") as f:
        json.dump([ROI_X, ROI_Y, ROI_W, ROI_H], f)
    return {"status": "ok", "x": ROI_X, "y": ROI_Y, "w": ROI_W, "h": ROI_H}

@app.get("/health")
def health():
    return {"status": "ok", "clases": CLASSES}


@app.post("/reconocer")
async def reconocer(file: UploadFile = File(...)):
    contents = await file.read()
    npimg = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    if frame is None:
        return JSONResponse(status_code=400, content={"error": "No se pudo leer la imagen enviada"})

    h_frame, w_frame = frame.shape[:2]
    if ROI_Y + ROI_H > h_frame or ROI_X + ROI_W > w_frame:
        return JSONResponse(status_code=400, content={"error": "La imagen enviada es mas pequena que el area (ROI) configurada"})

    crop = frame[ROI_Y:ROI_Y+ROI_H, ROI_X:ROI_X+ROI_W]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    
    cv2.imwrite("debug_crop.jpg", crop)
    cv2.imwrite("debug_limpio.jpg", preprocesar(gray))

    slot_w = ROI_W // SLOTS
    digitos = []
    for i in range(SLOTS):
        sx = i * slot_w
        ex = ROI_W if i == SLOTS - 1 else (i + 1) * slot_w
        slot_gray = gray[:, sx:ex]
        label = predecir_digito(slot_gray)
        if label != "blank":
            digitos.append(label)

    raw = "".join(digitos)
    peso = int(raw) if raw.isdigit() and raw != "" else None

    return {"peso": peso, "raw": raw}