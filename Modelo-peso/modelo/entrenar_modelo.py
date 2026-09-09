"""
entrenar_modelo.py
-------------------
Entrena una CNN pequena para reconocer digitos de 7 segmentos (0-9 + blank)
a partir del dataset generado con capturar_digitos.py.

USO:
    python entrenar_modelo.py

Requiere (instalar dentro del venv):
    pip install torch torchvision

Produce:
    digit_model.pth   -> pesos entrenados, listos para usar en la API FastAPI
    labels.json        -> mapeo indice -> etiqueta (0-9, blank)
"""

import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import transforms
from PIL import Image

DATASET_DIR = "dataset_aumentado"
IMG_SIZE = 32          # todas las imagenes se redimensionan a 32x32
BATCH_SIZE = 8
EPOCHS = 30
LR = 0.001

# ---------- Dataset ----------
class DigitDataset(Dataset):
    def __init__(self, root, transform):
        self.samples = []
        self.classes = sorted(os.listdir(root))  # ej: ['0','1',...,'9','blank']
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
        img = Image.open(path).convert("L")  # escala de grises
        img = self.transform(img)
        return img, label


# ---------- Modelo ----------
class DigitCNN(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 16, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),               # 32x32 -> 16x16

            nn.Conv2d(16, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),               # 16x16 -> 8x8
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(32 * 8 * 8, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


def main():
    transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
    ])

    full_dataset = DigitDataset(DATASET_DIR, transform)
    print(f"Total de imagenes en el dataset: {len(full_dataset)}")
    print(f"Clases encontradas: {full_dataset.classes}")

    if len(full_dataset) < 20:
        print("Muy pocas imagenes para entrenar. Captura mas con capturar_digitos.py")
        return

    # split 80% train / 20% validacion
    val_size = max(1, int(0.2 * len(full_dataset)))
    train_size = len(full_dataset) - val_size
    train_ds, val_ds = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Usando dispositivo: {device}")

    model = DigitCNN(num_classes=len(full_dataset.classes)).to(device)
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

        # validacion
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
        json.dump(full_dataset.classes, f)

    print(f"\nListo. Mejor precision de validacion: {best_val_acc*100:.1f}%")
    print("Modelo guardado en digit_model.pth")
    print("Etiquetas guardadas en labels.json")


if __name__ == "__main__":
    main()