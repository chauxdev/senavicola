"""
entrenar_modelo_v2.py
-----------------------
Version corregida: evita la fuga de datos (data leakage) que causaba que
la precision de validacion se viera bien sin que el modelo realmente
generalizara.

Diferencias clave vs la version anterior:
- Usa el dataset ORIGINAL (dataset/), no dataset_aumentado/
- Separa train/validacion PRIMERO, usando imagenes originales limpias
- La augmentacion (rotacion, brillo, ruido, zoom) se aplica "al vuelo"
  SOLO a las imagenes de entrenamiento, generando una variacion distinta
  en cada epoca (mejor que archivos fijos duplicados)
- La validacion usa siempre las fotos originales, sin ninguna alteracion,
  asi el numero de precision es honesto

USO:
    python entrenar_modelo_v2.py

Requiere: pip install torch torchvision pillow  (ya deberias tenerlos)
"""

import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import random

DATASET_DIR = "dataset"     # dataset ORIGINAL, no el aumentado
IMG_SIZE = 32
BATCH_SIZE = 16
EPOCHS = 40
LR = 0.001
VAL_FRACTION = 0.2


# ---------- Transforms ----------
train_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomRotation(8),
    transforms.RandomAffine(degrees=0, translate=(0.08, 0.08), scale=(0.9, 1.1)),
    transforms.ColorJitter(brightness=0.3, contrast=0.3),
    transforms.ToTensor(),
])

val_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
])


# ---------- Dataset ----------
class DigitDataset(Dataset):
    def __init__(self, samples, class_to_idx, transform):
        self.samples = samples  # lista de (path, label)
        self.class_to_idx = class_to_idx
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert("L")
        img = self.transform(img)
        return img, label


def cargar_samples(root):
    classes = sorted(os.listdir(root))
    class_to_idx = {c: i for i, c in enumerate(classes)}
    samples = []
    for c in classes:
        folder = os.path.join(root, c)
        if not os.path.isdir(folder):
            continue
        for fname in os.listdir(folder):
            if fname.lower().endswith((".png", ".jpg", ".jpeg")):
                samples.append((os.path.join(folder, fname), class_to_idx[c]))
    return samples, classes, class_to_idx


# ---------- Modelo ----------
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


def main():
    random.seed(42)
    torch.manual_seed(42)

    all_samples, classes, class_to_idx = cargar_samples(DATASET_DIR)
    print(f"Total de imagenes originales: {len(all_samples)}")
    print(f"Clases: {classes}")

    # separar train/val POR CLASE, usando imagenes originales (sin augmentar todavia)
    por_clase = {c: [] for c in classes}
    for path, label in all_samples:
        por_clase[classes[label]].append((path, label))

    train_samples, val_samples = [], []
    for c, items in por_clase.items():
        random.shuffle(items)
        n_val = max(1, int(len(items) * VAL_FRACTION))
        val_samples.extend(items[:n_val])
        train_samples.extend(items[n_val:])

    print(f"Entrenamiento: {len(train_samples)} imagenes | Validacion: {len(val_samples)} imagenes (originales, sin augmentar)")

    train_ds = DigitDataset(train_samples, class_to_idx, train_transform)
    val_ds = DigitDataset(val_samples, class_to_idx, val_transform)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Usando dispositivo: {device}")

    model = DigitCNN(num_classes=len(classes)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LR)

    best_val_acc = 0.0

    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss = 0.0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(imgs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * imgs.size(0)

        train_loss = total_loss / len(train_ds)

        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                outputs = model(imgs)
                preds = outputs.argmax(dim=1)
                correct += (preds == labels).sum().item()
                total += labels.size(0)
        val_acc = correct / total if total > 0 else 0.0

        print(f"Epoca {epoch:02d}/{EPOCHS}  perdida={train_loss:.4f}  precision_val={val_acc*100:.1f}%")

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), "digit_model.pth")

    with open("labels.json", "w") as f:
        json.dump(classes, f)

    print(f"\nListo. Mejor precision de validacion (HONESTA, sin fuga de datos): {best_val_acc*100:.1f}%")
    print("Modelo guardado en digit_model.pth")


if __name__ == "__main__":
    main()
