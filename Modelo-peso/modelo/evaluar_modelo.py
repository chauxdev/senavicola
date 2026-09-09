"""
evaluar_modelo.py
-------------------
Evalua el modelo entrenado sobre TODO el dataset y muestra una matriz de
confusion: cuantas veces cada digito real fue predicho como cada otro
digito. Esto ayuda a identificar EXACTAMENTE que digitos se confunden
entre si, para enfocar la proxima tanda de capturas ahi en vez de
capturar a ciegas.

USO:
    python evaluar_modelo.py
"""

import os
import json
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image

DATASET_DIR = "dataset"
IMG_SIZE = 32
MODEL_PATH = "digit_model.pth"
LABELS_PATH = "labels.json"


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


class DigitDataset(Dataset):
    def __init__(self, root, transform):
        self.samples = []
        self.classes = sorted(os.listdir(root))
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}
        for c in self.classes:
            folder = os.path.join(root, c)
            if not os.path.isdir(folder):
                continue
            for fname in os.listdir(folder):
                if fname.lower().endswith((".png", ".jpg", ".jpeg")):
                    self.samples.append((os.path.join(folder, fname), self.class_to_idx[c]))
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert("L")
        img = self.transform(img)
        return img, label


def main():
    with open(LABELS_PATH, "r") as f:
        classes = json.load(f)

    transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
    ])

    dataset = DigitDataset(DATASET_DIR, transform)
    loader = DataLoader(dataset, batch_size=16, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = DigitCNN(num_classes=len(classes))
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.to(device)
    model.eval()

    n = len(classes)
    matriz = [[0]*n for _ in range(n)]
    correctos_por_clase = [0]*n
    total_por_clase = [0]*n

    with torch.no_grad():
        for imgs, labels in loader:
            imgs = imgs.to(device)
            outputs = model(imgs)
            preds = outputs.argmax(dim=1).cpu()
            for real, pred in zip(labels, preds):
                matriz[real.item()][pred.item()] += 1
                total_por_clase[real.item()] += 1
                if real.item() == pred.item():
                    correctos_por_clase[real.item()] += 1

    print(f"\n{'='*70}")
    print("PRECISION POR DIGITO (sobre TODO el dataset, incluye datos de entrenamiento)")
    print(f"{'='*70}")
    for i, c in enumerate(classes):
        total = total_por_clase[i]
        correctos = correctos_por_clase[i]
        pct = (correctos/total*100) if total > 0 else 0
        marca = "  <-- revisar" if pct < 80 and total > 0 else ""
        print(f"  '{c}': {correctos}/{total} ({pct:.0f}%){marca}")

    print(f"\n{'='*70}")
    print("MATRIZ DE CONFUSION (fila = real, columna = prediccion)")
    print(f"{'='*70}")
    header = "        " + "".join(f"{c:>6}" for c in classes)
    print(header)
    for i, c in enumerate(classes):
        fila = f"real '{c}':".ljust(9) + "".join(f"{matriz[i][j]:>6}" for j in range(n))
        print(fila)

    print(f"\n{'='*70}")
    print("CONFUSIONES MAS FRECUENTES (errores por encima de 1):")
    print(f"{'='*70}")
    confusiones = []
    for i in range(n):
        for j in range(n):
            if i != j and matriz[i][j] > 0:
                confusiones.append((matriz[i][j], classes[i], classes[j]))
    confusiones.sort(reverse=True)
    for cantidad, real, pred in confusiones[:15]:
        if cantidad > 1:
            print(f"  '{real}' confundido con '{pred}': {cantidad} veces")

    print("\nRecomendacion: enfoca la proxima tanda de captura en los digitos")
    print("marcados '<-- revisar' arriba, y en los pares que mas se confunden.")


if __name__ == "__main__":
    main()
