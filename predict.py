import os
import json
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

def main():
    # Setup device
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")

    # Determine absolute project root relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    labels_path = os.path.join(script_dir, "labels.json")
    train_dir = os.path.join(script_dir, "new-data", "prepared", "train")
    model_path = os.path.join(script_dir, "pet_breed_model_v2.pth")

    if not os.path.exists(model_path):
        print(f"Error: Model weights not found at {model_path}. Please train the model first.")
        exit(1)

    # Load trained weights and get state dict
    checkpoint = torch.load(model_path, map_location=device, weights_only=True)
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
        class_names = checkpoint.get("class_names", [])
    else:
        state_dict = checkpoint
        class_names = []

    # Determine class count from state dict classifier
    classifier_weight_key = [k for k in state_dict.keys() if "classifier" in k and "weight" in k]
    if not classifier_weight_key:
        raise ValueError("Could not find classifier weights in state dict.")
    num_classes = state_dict[classifier_weight_key[0]].shape[0]

    # Populate class_names dynamically if empty
    if not class_names:
        if num_classes == 37:
            class_names = [
                'Abyssinian', 'Bengal', 'Birman', 'Bombay', 'British_Shorthair', 
                'Egyptian_Mau', 'Maine_Coon', 'Persian', 'Ragdoll', 'Russian_Blue', 
                'Siamese', 'Sphynx', 'american_bulldog', 'american_pit_bull_terrier', 
                'basset_hound', 'beagle', 'boxer', 'chihuahua', 'english_cocker_spaniel', 
                'english_setter', 'german_shorthaired', 'great_pyrenees', 'havanese', 
                'japanese_chin', 'keeshond', 'leonberger', 'miniature_pinscher', 
                'newfoundland', 'pomeranian', 'pug', 'saint_bernard', 'samoyed', 
                'scottish_terrier', 'shiba_inu', 'staffordshire_bull_terrier', 
                'wheaten_terrier', 'yorkshire_terrier'
            ]
        elif os.path.exists(labels_path):
            with open(labels_path, "r") as f:
                full_labels = json.load(f)
            if len(full_labels) == num_classes:
                class_names = full_labels
            else:
                if os.path.exists(train_dir):
                    dirs = sorted(os.listdir(train_dir))
                    if len(dirs) == num_classes:
                        class_names = dirs
                if not class_names:
                    class_names = full_labels[:num_classes]
        else:
            class_names = [f"class_{i}" for i in range(num_classes)]

    # Model Setup
    model = models.efficientnet_b1()
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes)
    )

    # Load state dict
    model.load_state_dict(state_dict)
    model = model.to(device)
    model.eval()

    # Image path input
    image_path = input("Enter image path: ").strip().strip("'").strip('"')

    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        exit(1)

    try:
        img = Image.open(image_path).convert("RGB")
    except Exception as e:
        print(f"Error opening image: {e}")
        exit(1)

    # Preprocess image
    preprocess = transforms.Compose([
        transforms.Resize((240, 240)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    input_tensor = preprocess(img).unsqueeze(0).to(device)

    # Predict
    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted_index = torch.max(probabilities, dim=1)

    predicted_breed = class_names[predicted_index.item()]
    confidence_pct = confidence.item() * 100

    print("\nPrediction:")
    print("Breed:", predicted_breed)
    print(f"Confidence: {confidence_pct:.2f}%")

if __name__ == "__main__":
    main()
