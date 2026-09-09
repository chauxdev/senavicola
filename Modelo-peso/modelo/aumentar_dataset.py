"""
aumentar_dataset.py
--------------------
Genera variaciones automaticas de cada imagen del dataset (rotacion leve,
cambios de brillo/contraste, ruido, desplazamiento) para multiplicar la
cantidad de datos de entrenamiento sin tener que capturar mas fotos a mano.

Esto ayuda a que el modelo generalice mejor y no memorice las fotos exactas
que le diste (que es lo que esta pasando ahora con solo 162 imagenes).

USO:
    python aumentar_dataset.py

Lee de:  dataset/
Escribe en: dataset_aumentado/   (deja el original intacto)

Despues de correr esto, hay que decirle a entrenar_modelo.py que use
dataset_aumentado en vez de dataset (ver instrucciones al final).
"""

import os
import cv2
import numpy as np
import random

ORIGEN = "dataset"
DESTINO = "dataset_aumentado"
VARIACIONES_POR_IMAGEN = 12  # cuantas copias variadas generar por cada imagen original

def variar_imagen(img):
    """Aplica una combinacion aleatoria de transformaciones leves."""
    h, w = img.shape[:2]
    out = img.copy()

    # 1. Rotacion leve (-8 a 8 grados)
    angle = random.uniform(-8, 8)
    M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1.0)
    out = cv2.warpAffine(out, M, (w, h), borderMode=cv2.BORDER_REPLICATE)

    # 2. Desplazamiento leve (traslacion)
    tx = random.randint(-3, 3)
    ty = random.randint(-3, 3)
    M2 = np.float32([[1, 0, tx], [0, 1, ty]])
    out = cv2.warpAffine(out, M2, (w, h), borderMode=cv2.BORDER_REPLICATE)

    # 3. Cambio de brillo/contraste
    alpha = random.uniform(0.7, 1.3)   # contraste
    beta = random.uniform(-25, 25)      # brillo
    out = cv2.convertScaleAbs(out, alpha=alpha, beta=beta)

    # 4. Ruido gaussiano leve
    if random.random() < 0.5:
        noise = np.random.normal(0, 8, out.shape).astype(np.int16)
        out = np.clip(out.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # 5. Escalado leve (zoom in/out)
    scale = random.uniform(0.92, 1.08)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(out, (new_w, new_h))
    # recortar o rellenar de vuelta al tamano original
    if scale > 1.0:
        startx = (new_w - w) // 2
        starty = (new_h - h) // 2
        out = resized[starty:starty+h, startx:startx+w]
    else:
        pad_w = (w - new_w) // 2
        pad_h = (h - new_h) // 2
        out = cv2.copyMakeBorder(resized, pad_h, h-new_h-pad_h, pad_w, w-new_w-pad_w,
                                   cv2.BORDER_REPLICATE)

    return out


def main():
    if not os.path.isdir(ORIGEN):
        print(f"No se encontro la carpeta '{ORIGEN}'. Corre esto desde la carpeta 'modelo'.")
        return

    total_generadas = 0
    clases = os.listdir(ORIGEN)

    for clase in clases:
        carpeta_origen = os.path.join(ORIGEN, clase)
        if not os.path.isdir(carpeta_origen):
            continue

        carpeta_destino = os.path.join(DESTINO, clase)
        os.makedirs(carpeta_destino, exist_ok=True)

        archivos = [f for f in os.listdir(carpeta_origen) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
        print(f"Clase '{clase}': {len(archivos)} imagenes originales")

        for fname in archivos:
            path = os.path.join(carpeta_origen, fname)
            img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue

            # guardar tambien el original sin modificar
            cv2.imwrite(os.path.join(carpeta_destino, f"orig_{fname}"), img)
            total_generadas += 1

            for i in range(VARIACIONES_POR_IMAGEN):
                variada = variar_imagen(img)
                out_name = f"aug{i}_{fname}"
                cv2.imwrite(os.path.join(carpeta_destino, out_name), variada)
                total_generadas += 1

    print(f"\nListo. Total de imagenes en '{DESTINO}': {total_generadas}")
    print("Ahora edita entrenar_modelo.py y cambia DATASET_DIR = 'dataset' por DATASET_DIR = 'dataset_aumentado'")


if __name__ == "__main__":
    main()
