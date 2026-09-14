import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

def main():
    # Settings
    IMG_SIZE = (240, 240)  # EfficientNet-B1 standard input size
    BATCH_SIZE = 32

    # Setup device
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")

    # Determine absolute project root relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    test_dir = os.path.join(script_dir, "new-data", "prepared", "test")
    model_path = os.path.join(script_dir, "pet_breed_model_v2.pth")

    if not os.path.exists(model_path):
        print(f"Error: Model weights not found at {model_path}. Please train the model first.")
        return

    # Data normalization for testing (matches validation setup)
    test_transforms = transforms.Compose([
        transforms.Resize(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Load trained weights and get state dict
    checkpoint = torch.load(model_path, map_location=device, weights_only=True)
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    else:
        state_dict = checkpoint

    # Determine class count from state dict classifier
    classifier_weight_key = [k for k in state_dict.keys() if "classifier" in k and "weight" in k]
    if not classifier_weight_key:
        raise ValueError("Could not find classifier weights in state dict.")
    model_num_classes = state_dict[classifier_weight_key[0]].shape[0]

    # Load test dataset
    test_dataset = datasets.ImageFolder(test_dir, transform=test_transforms)
    num_classes = len(test_dataset.classes)
    
    if num_classes != model_num_classes:
        print(f"Warning: Model expects {model_num_classes} classes but test dataset has {num_classes} classes. Adjusting model output layer.")
    
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=True)
    print(f"Loaded {len(test_dataset)} test images across {num_classes} classes.")

    # Model Setup
    model = models.efficientnet_b1()
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, model_num_classes)
    )

    # Load state dict
    model.load_state_dict(state_dict)
    model = model.to(device)
    model.eval()

    # Loss function
    criterion = nn.CrossEntropyLoss()

    print("Evaluating model on test dataset...")
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

    avg_loss = running_loss / total
    accuracy = correct / total

    print(f"\nTest Accuracy: {accuracy * 100:.2f}%")
    print(f"Test Loss: {avg_loss:.4f}")

if __name__ == "__main__":
    main()