"""
tomar_foto_prueba.py
---------------------
Toma UNA foto desde la misma camara (mismo indice, misma resolucion) que
usaste para generar el dataset con capturar_digitos.py, y la guarda en disco.
Asi garantizamos que la foto de prueba sea 100% compatible con el ROI
calibrado en api.py.

USO:
    python tomar_foto_prueba.py --camera 1

Guarda el archivo como foto_prueba.jpg en la misma carpeta.
Sube ESE archivo (no un screenshot ni foto de otra app) al endpoint
/reconocer en http://127.0.0.1:8000/docs
"""

import cv2
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--camera", type=int, default=1)
    args = parser.parse_args()

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print(f"No se pudo abrir la camara {args.camera}")
        return

    print("Presiona 'c' para tomar la foto, 'q' para salir sin guardar.")
    while True:
        ret, frame = cap.read()
        if not ret:
            print("No se pudo leer frame.")
            break

        cv2.imshow("Presiona 'c' para capturar | 'q' para salir", frame)
        key = cv2.waitKey(1) & 0xFF

        if key == ord('c'):
            cv2.imwrite("foto_prueba.jpg", frame)
            print(f"Guardada foto_prueba.jpg -- resolucion: {frame.shape[1]}x{frame.shape[0]}")
            break
        elif key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
