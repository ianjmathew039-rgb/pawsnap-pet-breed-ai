import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from torch.optim.lr_scheduler import ReduceLROnPlateau

# Settings
IMG_SIZE = (240, 240)  # EfficientNet-B1 standard input size
BATCH_SIZE = 64
EPOCHS_STAGE1 = 5
EPOCHS_STAGE2 = 10

def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    for inputs, labels in loader:
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * inputs.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
        
    return running_loss / total, correct / total

def validate_epoch(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    with torch.no_grad():
        for inputs, labels in loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
    return running_loss / total, correct / total

def main():
    # Setup device
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Enable cuDNN benchmarking if CUDA is available
    if device.type == "cuda":
        torch.backends.cudnn.benchmark = True

    # Data augmentation and normalization for training
    # Just normalization for validation
    train_transforms = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomResizedCrop(IMG_SIZE, scale=(0.8, 1.0)),
        transforms.RandomRotation(15),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transforms = transforms.Compose([
        transforms.Resize(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Determine absolute project root relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = script_dir
    
    train_dir = os.path.join(project_root, "new-data", "prepared", "train")
    val_dir = os.path.join(project_root, "new-data", "prepared", "validation")
    model_save_path = os.path.join(project_root, "pet_breed_model_v2.pth")

    # Load datasets
    train_dataset = datasets.ImageFolder(train_dir, transform=train_transforms)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_transforms)

    # DataLoader optimizations
    # Safely configure based on platform support
    num_workers = 8 if device.type in ["cuda", "cpu"] else 0
    pin_memory = True if device.type == "cuda" else False
    
    train_loader = DataLoader(
        train_dataset, 
        batch_size=BATCH_SIZE, 
        shuffle=True, 
        num_workers=num_workers, 
        pin_memory=pin_memory,
        persistent_workers=True if num_workers > 0 else False,
        prefetch_factor=2 if num_workers > 0 else None
    )
    val_loader = DataLoader(
        val_dataset, 
        batch_size=BATCH_SIZE, 
        shuffle=False, 
        num_workers=num_workers, 
        pin_memory=pin_memory,
        persistent_workers=True if num_workers > 0 else False,
        prefetch_factor=2 if num_workers > 0 else None
    )

    num_classes = len(train_dataset.classes)

    # Print a concise training summary
    print("=" * 50)
    print("TRAINING PIPELINE INITIALIZED")
    print(f"Device:             {device}")
    print(f"Number of Classes:  {num_classes}")
    print(f"Training Images:    {len(train_dataset)}")
    print(f"Validation Images:  {len(val_dataset)}")
    print(f"Batch Size:         {BATCH_SIZE}")
    print(f"Image Size:         {IMG_SIZE}")
    print("=" * 50)

    # Model Setup
    weights = models.EfficientNet_B1_Weights.DEFAULT
    model = models.efficientnet_b1(weights=weights)

    # Freeze base model for Stage 1
    for param in model.parameters():
        param.requires_grad = False

    # Replace classifier head
    # EfficientNet B1 features output is 1280
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes)
    )

    model = model.to(device)

    # Loss function
    criterion = nn.CrossEntropyLoss()

    # STAGE 1: Train only the classification head
    print("\n--- STAGE 1: Training classification head ---")
    optimizer1 = optim.AdamW(model.classifier.parameters(), lr=1e-3, weight_decay=1e-2)
    scheduler1 = ReduceLROnPlateau(optimizer1, mode='min', factor=0.2, patience=2, min_lr=1e-6)

    best_val_loss = float('inf')

    for epoch in range(EPOCHS_STAGE1):
        train_loss, train_acc = train_epoch(model, train_loader, optimizer1, criterion, device)
        val_loss, val_acc = validate_epoch(model, val_loader, criterion, device)
        scheduler1.step(val_loss)
        print(f"Stage 1 - Epoch {epoch+1}/{EPOCHS_STAGE1} - Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f} - Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            # Save immediately to prevent losing progress if interrupted
            checkpoint = {
                "model_state_dict": {k: v.cpu() for k, v in model.state_dict().items()},
                "architecture": "efficientnet_b1",
                "image_size": IMG_SIZE,
                "class_names": train_dataset.classes,
                "epoch": epoch + 1,
                "stage": 1
            }
            torch.save(checkpoint, model_save_path)
            print(f"-> Saved new best Stage 1 checkpoint with Val Loss: {val_loss:.4f}")

    # Load best weights before Stage 2
    if os.path.exists(model_save_path):
        checkpoint = torch.load(model_save_path, map_location=device, weights_only=True)
        model.load_state_dict(checkpoint["model_state_dict"])

    # STAGE 2: Fine-tuning top layers of base model
    print("\n--- STAGE 2: Fine-tuning base model ---")
    # Unfreeze all layers for fine tuning
    for param in model.parameters():
        param.requires_grad = True

    # Lower learning rate for fine-tuning
    optimizer2 = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-2)
    scheduler2 = ReduceLROnPlateau(optimizer2, mode='min', factor=0.2, patience=2, min_lr=1e-7)

    # Early stopping parameters
    early_stop_patience = 4
    epochs_no_improve = 0

    for epoch in range(EPOCHS_STAGE2):
        train_loss, train_acc = train_epoch(model, train_loader, optimizer2, criterion, device)
        val_loss, val_acc = validate_epoch(model, val_loader, criterion, device)
        scheduler2.step(val_loss)
        print(f"Stage 2 - Epoch {epoch+1}/{EPOCHS_STAGE2} - Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f} - Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            epochs_no_improve = 0
            # Save immediately to prevent losing progress if interrupted
            checkpoint = {
                "model_state_dict": {k: v.cpu() for k, v in model.state_dict().items()},
                "architecture": "efficientnet_b1",
                "image_size": IMG_SIZE,
                "class_names": train_dataset.classes,
                "epoch": epoch + 1,
                "stage": 2
            }
            torch.save(checkpoint, model_save_path)
            print(f"-> Saved new best Stage 2 checkpoint with Val Loss: {val_loss:.4f}")
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= early_stop_patience:
                print(f"\nEarly stopping triggered: validation loss did not improve for {early_stop_patience} consecutive epochs.")
                break

    print(f"\nTraining complete! Best model is saved to {model_save_path}")

if __name__ == "__main__":
    main()
