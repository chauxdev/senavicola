"""
server.py - Proyecto deteccion-huevos
---------------------------------------
Detecta el huevo con el modelo entrenado (best.pt, YOLOv8-seg), mide su
largo y diámetro reales usando el contorno detectado + la escala calibrada
con la hoja milimetrada, calcula el volumen con 3 fórmulas distintas y
clasifica el huevo por categoría (peso + volumen) según la NTC 1240:2011.

Cómo correrlo:
    uvicorn server:app --host 127.0.0.1 --port 8020   (para el proyecto Nest)
    uvicorn server:app --host 127.0.0.1 --port 8021   (para el proyecto C#)

(Corre dos copias de esta misma carpeta, una por proyecto, cada una con su
 propio escala_config.json si las cámaras son distintas - mismo patrón que
 ya usas en ZonaAvicola con los puertos 8000/8001.)
"""

import base64
import json
import math
import os
from typing import Optional
import sys

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# Modelo entrenado (best.pt) - se carga una sola vez al arrancar
# ---------------------------------------------------------------------
def ruta_recurso(ruta_relativa):
    """
    Devuelve la ruta correcta tanto si corres server.py normal (con Python)
    como si corres el .exe empaquetado con PyInstaller (que descomprime
    los archivos en una carpeta temporal referenciada por sys._MEIPASS).
    """
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, ruta_relativa)

def ruta_junto_al_exe(nombre_archivo):
    """Archivos que viven AL LADO del .exe (lectura/escritura: escala)."""
    if getattr(sys, "frozen", False):
        base = os.path.dirname(sys.executable)
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, nombre_archivo)

RUTA_MODELO = ruta_recurso(os.path.join("modelo", "best.pt"))
modelo = YOLO(RUTA_MODELO)
RUTA_MODELO_COCO = ruta_recurso(os.path.join("modelo", "yolov8n.pt"))
modelo_coco = YOLO(RUTA_MODELO_COCO)

UMBRAL_CONFIANZA_COCO = 0.35   # si COCO reconoce algo conocido ahi con esta confianza o mas, se descarta
UMBRAL_SOLAPAMIENTO_COCO = 0.3  # IoU minimo para considerar que es el MISMO objeto


def _iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    inter = max(0, xB - xA) * max(0, yB - yA)
    if inter == 0:
        return 0.0
    areaA = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    areaB = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    return inter / float(areaA + areaB - inter)


def es_objeto_conocido_no_huevo(frame: np.ndarray, bbox_huevo: tuple) -> bool:
    """
    Corre el modelo COCO general sobre el mismo frame. Si detecta, en la MISMA
    zona donde nuestro modelo dice que hay un huevo, un objeto de una clase
    conocida (reloj, mouse, teclado, celular, taza, etc.) con confianza
    razonable, asumimos que es un falso positivo y lo rechazamos.
    """
    resultados_coco = modelo_coco(frame, verbose=False)
    if not resultados_coco or resultados_coco[0].boxes is None:
        return False

    for box in resultados_coco[0].boxes:
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        nombre_clase = modelo_coco.names[cls_id]
        if conf < UMBRAL_CONFIANZA_COCO:
            continue
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
        if _iou(bbox_huevo, (x1, y1, x2, y2)) >= UMBRAL_SOLAPAMIENTO_COCO:
            print(f"COCO detectó un {nombre_clase} (conf: {conf:.2f}), pero lo dejaremos pasar por ahora.", flush=True)
            # return True  # TEMPORARILY DISABLED to allow brown eggs
    return False
# ---------------------------------------------------------------------
# Escala (px por cm) - calibrada con calibrar_escala.py sobre la hoja
# milimetrada. Si todavía no se ha calibrado, usa el fallback.
RUTA_ESCALA = ruta_junto_al_exe("escala_config.json")# ---------------------------------------------------------------------

PX_POR_CM_FALLBACK = 35.0

# --- Estado temporal para suavizar medidas entre frames (una camara por proceso/puerto) ---
_estado_temporal = {"largo_cm": None, "diametro_cm": None, "volumen_cm3": None, "frames_sin_deteccion": 0}
ALPHA_TEMPORAL = 0.25  # mas bajo = mas estable pero mas lento en reaccionar
FRAMES_RESET = 10      # si se pierde el huevo N llamadas seguidas, se reinicia el suavizado


def leer_escala_actual() -> float:
    try:
        with open(RUTA_ESCALA, "r") as f:
            datos = json.load(f)
            return float(datos.get("px_por_cm", PX_POR_CM_FALLBACK))
    except (FileNotFoundError, json.JSONDecodeError):
        return PX_POR_CM_FALLBACK


# ---------------------------------------------------------------------
# Tabla oficial NTC 1240:2011 / FENAVI (peso en g, volumen en cm3)
# ---------------------------------------------------------------------
CATEGORIAS = [
    ("C",     0.0,  46.0,   0.0,  42.3),
    ("B",     46.0, 52.9,   42.3, 48.7),
    ("A",     53.0, 59.9,   48.8, 55.1),
    ("AA",    60.0, 66.9,   55.2, 61.6),
    ("AAA",   67.0, 77.9,   61.7, 71.8),
    ("JUMBO", 78.0, 120.0,  71.8, 110.0),
]


def _distancia_normalizada(valor: float, minimo: float, maximo: float) -> float:
    ancho = max(maximo - minimo, 1e-6)
    if minimo <= valor <= maximo:
        return 0.0
    return (minimo - valor) / ancho if valor < minimo else (valor - maximo) / ancho


PESO_VS_VOLUMEN = 5.0  # cuanto mayor, mas domina el peso sobre el volumen al clasificar

def clasificar_huevo(peso_g: float, volumen_cm3: float, peso_valido: bool) -> dict:
    mejor_categoria, mejor_score = None, float("inf")
    for nombre, p_min, p_max, v_min, v_max in CATEGORIAS:
        d_peso = _distancia_normalizada(peso_g, p_min, p_max) if peso_valido else 0.0
        d_vol = _distancia_normalizada(volumen_cm3, v_min, v_max)
        score = (d_peso * PESO_VS_VOLUMEN + d_vol) if peso_valido else d_vol
        if score < mejor_score:
            mejor_score, mejor_categoria = score, nombre
    return {
        "categoria": mejor_categoria,
        "confianza": "peso_y_volumen" if peso_valido else "volumen",
    }


# ---------------------------------------------------------------------
# Las 3 fórmulas de volumen
# ---------------------------------------------------------------------

def volumen_elipsoide(largo_cm: float, diametro_cm: float) -> float:
    a, b = largo_cm / 2.0, diametro_cm / 2.0
    return (4.0 / 3.0) * math.pi * a * (b ** 2)


def volumen_por_contorno(mascara_px: np.ndarray, px_por_cm: float, n_discos: int = 60) -> float:
    """Volumen real por el contorno de la máscara (teorema de Pappus)."""
    contornos, _ = cv2.findContours(mascara_px.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contornos:
        return None
    contorno = max(contornos, key=cv2.contourArea).reshape(-1, 2).astype(np.float32)

    centro = contorno.mean(axis=0)
    pts_c = contorno - centro
    cov = np.cov(pts_c.T)
    valores, vectores = np.linalg.eigh(cov)
    eje_mayor = vectores[:, np.argmax(valores)]
    eje_mayor = eje_mayor / np.linalg.norm(eje_mayor)
    eje_menor = np.array([-eje_mayor[1], eje_mayor[0]])

    proy_mayor = pts_c @ eje_mayor
    proy_menor = pts_c @ eje_menor

    largo_px = proy_mayor.max() - proy_mayor.min()
    if largo_px <= 0:
        return None

    inicio = proy_mayor.min()
    paso = largo_px / n_discos
    volumen_px3 = 0.0
    for i in range(n_discos):
        lo, hi = inicio + i * paso, inicio + (i + 1) * paso
        mascara_franja = (proy_mayor >= lo) & (proy_mayor < hi)
        if not np.any(mascara_franja):
            continue
        radio_px = np.max(np.abs(proy_menor[mascara_franja]))
        volumen_px3 += math.pi * (radio_px ** 2) * paso

    return volumen_px3 / (px_por_cm ** 3)


def volumen_narushin(largo_cm: float, diametro_cm: float) -> float:
    return 0.51 * largo_cm * (diametro_cm ** 2)


# ---------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------

@app.get("/ping")
def ping():
    return {"status": "ok"}


@app.get("/escala")
def escala():
    return {"px_por_cm": leer_escala_actual()}

class CalibracionRequest(BaseModel):
    punto1: list[float]      # [x, y] en pixeles del frame recibido
    punto2: list[float]      # [x, y] en pixeles del frame recibido
    distancia_cm: float      # distancia REAL entre esos 2 puntos, en cm


@app.post("/calibrar-escala")
def calibrar_escala(req: CalibracionRequest):
    """
    Recalibra px_por_cm al vuelo, sin necesidad de correr calibrar_escala.py
    por terminal. El frontend manda 2 puntos que el usuario marco sobre la
    hoja milimetrada (en el frame actual, a la distancia ACTUAL de la
    camara) + la distancia real en cm entre esos puntos.
    """
    if req.distancia_cm <= 0:
        return {"error": "La distancia debe ser mayor que 0"}

    x1, y1 = req.punto1
    x2, y2 = req.punto2
    distancia_px = math.hypot(x2 - x1, y2 - y1)

    if distancia_px < 5:
        return {"error": "Los 2 puntos estan demasiado cerca, marca puntos mas separados"}

    nuevo_px_por_cm = distancia_px / req.distancia_cm

    with open(RUTA_ESCALA, "w") as f:
        json.dump({"px_por_cm": nuevo_px_por_cm}, f)

    return {"status": "ok", "px_por_cm": round(nuevo_px_por_cm, 2)}


def procesar_frame(frame: np.ndarray, peso_g: Optional[float], n_puntos_contorno: int = 60) -> dict:
    """
    Logica central de deteccion, compartida por /clasificar (multipart, usado
    por Nest) y /detectar-vivo (JSON, usado por el loop en vivo de Angular).
    Devuelve tambien el CONTORNO REAL (poligono que YOLO detecto), no solo
    la elipse aproximada, para poder dibujarlo tal cual en el frontend.
    """
    px_por_cm = leer_escala_actual()

    cv2.imwrite("debug_vol.jpg", frame)
    
    res_coco = modelo_coco(frame, conf=0.1, verbose=False)
    if res_coco and res_coco[0].boxes:
        for box in res_coco[0].boxes:
            print(f"COCO detectó en todo el frame: {modelo_coco.names[int(box.cls[0])]} (conf {float(box.conf[0]):.2f})", flush=True)

    resultados = modelo(frame, conf=0.10, verbose=False)
    if not resultados or resultados[0].masks is None or len(resultados[0].masks.data) == 0:
        _estado_temporal["frames_sin_deteccion"] += 1
        if _estado_temporal["frames_sin_deteccion"] >= FRAMES_RESET:
            _estado_temporal["largo_cm"] = None
            _estado_temporal["diametro_cm"] = None
            _estado_temporal["volumen_cm3"] = None
        print("RECHAZADO por YOLO (no masks)", flush=True)
        return {"huevo_detectado": False}

    mascara_modelo = resultados[0].masks.data[0].cpu().numpy()
    alto_frame, ancho_frame = frame.shape[:2]
    mascara_px = cv2.resize(mascara_modelo, (ancho_frame, alto_frame), interpolation=cv2.INTER_LINEAR)
    mascara_px = (mascara_px > 0.5).astype(np.uint8)

    gris = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    brillo_promedio = cv2.mean(gris, mask=mascara_px)[0]
    UMBRAL_BRILLO_MINIMO = 60
    if brillo_promedio < UMBRAL_BRILLO_MINIMO:
        print(f"RECHAZADO por brillo={brillo_promedio}", flush=True)
        return {"huevo_detectado": False}

    contornos, _ = cv2.findContours(mascara_px, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contornos:
        print("RECHAZADO por sin contornos", flush=True)
        return {"huevo_detectado": False}
    contorno_principal = max(contornos, key=cv2.contourArea)

    if len(contorno_principal) < 5:
        print("RECHAZADO por contorno<5", flush=True)
        return {"huevo_detectado": False}

    if forma_es_sospechosa(contorno_principal):
        print("RECHAZADO por forma_es_sospechosa", flush=True)
        return {"huevo_detectado": False}

    x, y, w, h = cv2.boundingRect(contorno_principal)
    bbox_huevo = (x, y, x + w, y + h)
    if es_objeto_conocido_no_huevo(frame, bbox_huevo):
        print("RECHAZADO por objeto conocido COCO", flush=True)
        return {"huevo_detectado": False}


    
    elipse = cv2.fitEllipse(contorno_principal)
    (cx, cy), (ancho_px, alto_px), angulo = elipse
    eje_mayor_px = max(ancho_px, alto_px)
    eje_menor_px = min(ancho_px, alto_px)

    largo_cm = eje_mayor_px / px_por_cm
    diametro_cm = eje_menor_px / px_por_cm

    # --- Suavizado temporal: evita que el volumen y la categoria salten frame a frame ---
    if _estado_temporal["largo_cm"] is None:
        largo_suave = largo_cm
        diametro_suave = diametro_cm
    else:
        largo_suave = ALPHA_TEMPORAL * largo_cm + (1 - ALPHA_TEMPORAL) * _estado_temporal["largo_cm"]
        diametro_suave = ALPHA_TEMPORAL * diametro_cm + (1 - ALPHA_TEMPORAL) * _estado_temporal["diametro_cm"]

    _estado_temporal["largo_cm"] = largo_suave
    _estado_temporal["diametro_cm"] = diametro_suave
    _estado_temporal["frames_sin_deteccion"] = 0

    # Redondeamos a 1 decimal ANTES de calcular volumen: la 2a cifra decimal
    # (ej. 4.6032 vs 4.5978, ambas se ven "4.60" en pantalla) es la que traia
    # ruido invisible al volumen. Con esto, el calculo usa exactamente lo que
    # se ve -- si el diametro/largo en pantalla no cambian, el volumen tampoco.
    largo_cm = round(largo_suave, 1)
    diametro_cm = round(diametro_suave, 1)

    v1 = volumen_elipsoide(largo_cm, diametro_cm)
    v2 = volumen_por_contorno(mascara_px, px_por_cm)
    v3 = volumen_narushin(largo_cm, diametro_cm)
    valores_validos = [v for v in (v1, v2, v3) if v is not None]
    volumen_crudo = sum(valores_validos) / len(valores_validos)


    # v2 (por contorno) es el UNICO de los 3 que no depende de largo_cm/diametro_cm:
    # se recalcula del contorno crudo de la mascara en cada llamada, sin ningun
    # suavizado -- por eso aunque largo/diametro ya esten estables, v2 solo puede
    # seguir saltando y arrastra el promedio final. Le aplicamos el mismo EMA
    # sobre el promedio ya calculado para que quede estable tambien.
    if _estado_temporal["volumen_cm3"] is None:
        volumen_promedio = volumen_crudo
    else:
        volumen_promedio = ALPHA_TEMPORAL * volumen_crudo + (1 - ALPHA_TEMPORAL) * _estado_temporal["volumen_cm3"]
    _estado_temporal["volumen_cm3"] = volumen_promedio

    peso_valido = peso_g is not None and peso_g > 0
    clasificacion = clasificar_huevo(peso_g if peso_valido else 0.0, volumen_promedio, peso_valido)

    # Reducir el contorno (puede traer cientos de puntos) a ~n_puntos_contorno
    # para que el payload sea liviano y se pueda dibujar cada ~800ms sin
    # saturar la conexion. cv2.approxPolyDP conserva la forma real del huevo.
    perimetro = cv2.arcLength(contorno_principal, True)
    epsilon = 0.002 * perimetro
    contorno_simplificado = cv2.approxPolyDP(contorno_principal, epsilon, True)
    puntos_contorno = [[int(p[0][0]), int(p[0][1])] for p in contorno_simplificado]
  

    return {
        "huevo_detectado": True,
        "largo_cm": round(largo_cm, 2),
        "diametro_cm": round(diametro_cm, 2),
        "volumen_elipsoide_cm3": round(v1, 2),
        "volumen_contorno_cm3": round(v2, 2) if v2 is not None else None,
        "volumen_narushin_cm3": round(v3, 2),
        "volumen_promedio_cm3": round(volumen_promedio, 2),
        "categoria": clasificacion["categoria"],
        "clasificado_por": clasificacion["confianza"],
        "contorno": puntos_contorno,
        "elipse": {
            "cx": round(cx, 1),
            "cy": round(cy, 1),
            "ancho_px": round(ancho_px, 1),
            "alto_px": round(alto_px, 1),
            "angulo_deg": round(angulo, 1),
        },
        "_frame": frame,
        "_contorno_cv": contorno_principal,
        "_elipse_cv": elipse,
    }

def forma_es_sospechosa(contorno) -> bool:
    area = cv2.contourArea(contorno)
    perimetro = cv2.arcLength(contorno, True)
    if perimetro == 0: return True
    circularidad = 4 * math.pi * area / (perimetro ** 2)
    hull = cv2.convexHull(contorno)
    area_hull = cv2.contourArea(hull)
    solidez = area / area_hull if area_hull > 0 else 0
    UMBRAL_CIRCULARIDAD_MAX = 0.93
    UMBRAL_SOLIDEZ_MIN = 0.90
    UMBRAL_ELONGACION_MIN = 1.15
    print(f"DEBUG_SHAPE: circ={circularidad:.3f} solidez={solidez:.3f}", flush=True)
    if circularidad > UMBRAL_CIRCULARIDAD_MAX:
        print("RECHAZADO por circularidad", flush=True)
        return True
    if solidez < UMBRAL_SOLIDEZ_MIN:
        print("RECHAZADO por solidez", flush=True)
        return True
    if len(contorno) >= 5:
        (_, _), (ancho, alto), _ = cv2.fitEllipse(contorno)
        eje_mayor = max(ancho, alto)
        eje_menor = min(ancho, alto)
        elongacion = eje_mayor / eje_menor if eje_menor > 0 else 0
        print(f"DEBUG_SHAPE: elong={elongacion:.3f}", flush=True)
        if elongacion < UMBRAL_ELONGACION_MIN:
            print("RECHAZADO por elongacion", flush=True)
            return True
    return False


def es_probablemente_piel(frame: np.ndarray, mascara_px: np.ndarray, umbral_pct: float = 0.40) -> bool:
    """
    Revisa que porcentaje de los pixeles DENTRO de la mascara detectada
    corresponden a tono de piel humana (espacio de color YCrCb, rango
    estandar de deteccion de piel). Si un % alto es piel, es una mano/puño,
    no un huevo.
    """
    ycrcb = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)
    mascara_piel = cv2.inRange(ycrcb, (0, 133, 77), (255, 173, 127))
    piel_en_objeto = cv2.bitwise_and(mascara_piel, mascara_piel, mask=mascara_px)

    total_px_objeto = cv2.countNonZero(mascara_px)
    if total_px_objeto == 0:
        return False

    pct_piel = cv2.countNonZero(piel_en_objeto) / total_px_objeto
    return pct_piel >= umbral_pct


@app.post("/clasificar")
async def clasificar(imagen: UploadFile = File(...), peso_g: float = -1):
    """
    Recibe una foto del huevo (multipart/form-data, campo 'imagen').
    Usado por Nest (deteccion-huevo.service.ts) para la captura puntual
    con imagen anotada en base64. peso_g es opcional (query param).
    """
    contenido = await imagen.read()
    array_np = np.frombuffer(contenido, dtype=np.uint8)
    frame = cv2.imdecode(array_np, cv2.IMREAD_COLOR)

    if frame is None:
        return {"error": "No se pudo leer la imagen enviada"}

    peso_valido = peso_g is not None and peso_g > 0
    resultado = procesar_frame(frame, peso_g if peso_valido else None)

    if not resultado.get("huevo_detectado"):
        return {"huevo_detectado": False}

    contorno_principal = resultado.pop("_contorno_cv")
    elipse = resultado.pop("_elipse_cv")
    frame_local = resultado.pop("_frame")
    (cx, cy), (ancho_px, alto_px), angulo = elipse

    frame_anotado = frame_local.copy()
    cv2.drawContours(frame_anotado, [contorno_principal], -1, (0, 255, 255), 2)
    cv2.ellipse(frame_anotado, elipse, (0, 255, 0), 2)
    cv2.putText(frame_anotado, f"{resultado['largo_cm']:.2f}cm x {resultado['diametro_cm']:.2f}cm",
                (int(cx - 60), int(cy - alto_px / 2 - 10)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
    _, buffer = cv2.imencode(".jpg", frame_anotado)
    resultado["frame_anotado"] = base64.b64encode(buffer).decode("utf-8")

    return resultado


class FrameVivoRequest(BaseModel):
    frame: str  # data URL: "data:image/jpeg;base64,...."
    peso_g: Optional[float] = None


@app.post("/detectar-vivo")
async def detectar_vivo(payload: FrameVivoRequest):
    """
    Version liviana para el loop en vivo de Angular (se llama cada ~800ms).
    Recibe el frame como JSON (mismo formato que ya usas contra el 8001) y
    devuelve el CONTORNO REAL detectado por YOLO (lista de puntos [x,y] en
    pixeles del frame recibido) para dibujarlo tal cual sobre el canvas,
    en vez de una elipse aproximada. No devuelve frame_anotado (mas rapido).
    """
    try:
        data_url = payload.frame
        if "," in data_url:
            data_url = data_url.split(",", 1)[1]
        contenido = base64.b64decode(data_url)
        array_np = np.frombuffer(contenido, dtype=np.uint8)
        frame = cv2.imdecode(array_np, cv2.IMREAD_COLOR)
    except Exception:
        return {"huevo_detectado": False, "error": "No se pudo decodificar el frame"}

    if frame is None:
        return {"huevo_detectado": False, "error": "No se pudo decodificar el frame"}

    peso_valido = payload.peso_g is not None and payload.peso_g > 0
    resultado = procesar_frame(frame, payload.peso_g if peso_valido else None)

    resultado.pop("_frame", None)
    resultado.pop("_contorno_cv", None)
    resultado.pop("_elipse_cv", None)
    print("YOLO result:", resultado)
    return resultado