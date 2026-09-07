import cv2
import json
import math
import argparse
import numpy as np

# Configuración
CONFIG_FILE = "escala_config.json"
PUNTOS = []
DISTANCIA_CM = 5.0  # Modificar si se usa otra medida (ej. 10 cm)

def click_event(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        if len(PUNTOS) < 2:
            PUNTOS.append((x, y))
            print(f"Punto marcado en: ({x}, {y})")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cam", type=int, default=0, help="Índice de la cámara")
    parser.add_argument("--dist", type=float, default=5.0, help="Distancia real en cm entre los dos puntos (ej. cuadricula de 10 cuadros de 5mm = 5cm)")
    args = parser.parse_args()

    DISTANCIA_CM = args.dist
    cap = cv2.VideoCapture(args.cam)
    
    if not cap.isOpened():
        print("No se pudo abrir la cámara.")
        return

    cv2.namedWindow("Calibracion Escala")
    cv2.setMouseCallback("Calibracion Escala", click_event)

    print(f"Instrucciones:")
    print(f"1. Pon la hoja milimetrada bajo la cámara a la altura exacta donde pondrás los huevos.")
    print(f"2. Haz clic izquierdo en un punto.")
    print(f"3. Haz clic izquierdo en otro punto que esté a exactamente {DISTANCIA_CM} cm de distancia del primero.")
    print(f"4. Presiona 'q' o 'ESC' para salir.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Dibujar puntos y línea
        if len(PUNTOS) > 0:
            cv2.circle(frame, PUNTOS[0], 5, (0, 0, 255), -1)
        if len(PUNTOS) > 1:
            cv2.circle(frame, PUNTOS[1], 5, (0, 0, 255), -1)
            cv2.line(frame, PUNTOS[0], PUNTOS[1], (0, 255, 0), 2)
            
            # Calcular e imprimir escala
            dist_px = math.hypot(PUNTOS[1][0] - PUNTOS[0][0], PUNTOS[1][1] - PUNTOS[0][1])
            px_por_cm = dist_px / DISTANCIA_CM
            
            # Mostrar resultado en pantalla
            cv2.putText(frame, f"Dist px: {dist_px:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, f"px_por_cm: {px_por_cm:.2f}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow("Calibracion Escala", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == 27:
            break
        elif key == ord('c'):
            PUNTOS.clear()
            print("Puntos borrados. Marca de nuevo.")

    if len(PUNTOS) == 2:
        dist_px = math.hypot(PUNTOS[1][0] - PUNTOS[0][0], PUNTOS[1][1] - PUNTOS[0][1])
        px_por_cm = dist_px / DISTANCIA_CM
        print(f"\nResultado Final:")
        print(f"Distancia en píxeles: {dist_px:.2f} px")
        print(f"Distancia real: {DISTANCIA_CM} cm")
        print(f"Píxeles por cm: {px_por_cm:.2f} px/cm")
        
        # Guardar en archivo
        with open(CONFIG_FILE, "w") as f:
            json.dump({"px_por_cm": round(px_por_cm, 2)}, f)
        print(f"Configuración guardada en {CONFIG_FILE}!")
    else:
        print("\nNo se marcaron los 2 puntos. No se guardó la calibración.")

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
