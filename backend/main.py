import os
import json
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms, models
from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
import io

app = FastAPI(title="PawSnap API")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup device
device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
print(f"Using device: {device}")

# Load model and class names using absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH_V2 = os.path.abspath(os.path.join(BASE_DIR, "..", "pet_breed_model_v2.pth"))
MODEL_PATH_V1 = os.path.abspath(os.path.join(BASE_DIR, "..", "pet_breed_model.pth"))
MODEL_PATH = MODEL_PATH_V2 if os.path.exists(MODEL_PATH_V2) else MODEL_PATH_V1
LABELS_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "labels.json"))

CAT_BREED_SET = {
    'abyssinian', 'american_bobtail', 'american_curl', 'american_shorthair', 'american_wirehair', 
    'applehead_siamese', 'balinese', 'bengal', 'birman', 'bombay', 'british_shorthair', 
    'burmese', 'burmilla', 'calico', 'canadian_hairless', 'chartreux', 'chausie', 'chinchilla', 
    'cornish_rex', 'cymric', 'devon_rex', 'dilute_calico', 'dilute_tortoiseshell', 'domestic_long_hair', 
    'domestic_medium_hair', 'domestic_short_hair', 'egyptian_mau', 'exotic_shorthair', 
    'extra-toes_cat_-_hemingway_polydactyl', 'havana', 'himalayan', 'japanese_bobtail', 'javanese', 
    'korat', 'laperm', 'maine_coon', 'manx', 'munchkin', 'nebelung', 'norwegian_forest_cat', 
    'ocicat', 'oriental_long_hair', 'oriental_short_hair', 'oriental_tabby', 'persian', 'pixiebob', 
    'ragamuffin', 'ragdoll', 'russian_blue', 'scottish_fold', 'selkirk_rex', 'siamese', 'siberian', 
    'silver', 'singapura', 'snowshoe', 'somali', 'sphynx_-_hairless_cat', 'tabby', 'tiger', 
    'tonkinese', 'torbie', 'tortoiseshell', 'turkish_angora', 'turkish_van', 'tuxedo', 'york_chocolate'
}

try:
    checkpoint = torch.load(MODEL_PATH, map_location=device, weights_only=True)
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
        elif os.path.exists(LABELS_PATH):
            with open(LABELS_PATH, "r") as f:
                full_labels = json.load(f)
            if len(full_labels) == num_classes:
                class_names = full_labels
            else:
                # If there's a mismatch, try listing training dir or slice
                train_dir = os.path.abspath(os.path.join(BASE_DIR, "..", "new-data", "prepared", "train"))
                if os.path.exists(train_dir):
                    dirs = sorted(os.listdir(train_dir))
                    if len(dirs) == num_classes:
                        class_names = dirs
                if not class_names:
                    class_names = full_labels[:num_classes]
        else:
            class_names = [f"class_{i}" for i in range(num_classes)]

    model = models.efficientnet_b1()
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes)
    )
    model.load_state_dict(state_dict)
    model = model.to(device)
    model.eval()
    print(f"Successfully loaded PyTorch model from {MODEL_PATH} with {len(class_names)} classes.")
except Exception as e:
    print(f"Error loading model/labels: {e}")
    model = None
    class_names = []

# Custom static files subclass to add CORS headers explicitly to static file responses
class CORSStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope) -> Response:
        response = await super().get_response(path, scope)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

# Mount data directory static files using absolute paths
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))

if os.path.exists(DATA_DIR):
    app.mount("/data", CORSStaticFiles(directory=DATA_DIR), name="data")
    print(f"Mounted static directory: {DATA_DIR} at /data")
else:
    print(f"Warning: Data directory {DATA_DIR} not found. Cannot serve samples.")

# Breed information database (Legacy fallback)
BREED_INFO = {
    "abyssinian": "Active, curious, and highly intelligent cats. They love exploring high vantage points and are known for their beautiful ticked coats.",
    "bengal": "Displaying a wild leopard-like appearance with a friendly temperament. Highly energetic, vocal, and love water.",
    "birman": "Often called the 'Sacred Cat of Burma'. Gentle, quiet, and sweet-tempered companions with distinctive blue eyes and white gloves.",
    "bombay": "Sleek, jet-black cats resembling miniature panthers with copper eyes. They are highly affectionate, playful, and social.",
    "british_shorthair": "Calm, easygoing, and quiet. They have thick, plush coats, round features, and are very loyal companions.",
    "egyptian_mau": "The only naturally spotted breed of domestic cat and the fastest runner. They are active, intelligent, and fiercely loyal.",
    "maine_coon": "The largest domestic cat breed. Affectionate, gentle giants known for their heavy, shaggy coats and tufted ears.",
    "persian": "Calm, quiet, and sweet-tempered. They prefer peaceful homes, have flat faces with long coats, and love lounging on comfortable cushions.",
    "ragdoll": "Docile, sweet, and incredibly affectionate. They are famous for going completely limp and relaxed when held.",
    "russian_blue": "Quiet, reserved with strangers but deeply devoted to family. They are elegant with dense, silver-blue coats.",
    "siamese": "Extremely vocal, social, and intelligent cats. They form intense bonds with their owners and have striking color-point coats.",
    "sphynx": "Famous for their hairless bodies. They are energetic, warm to the touch, and love showing off to remain the center of attention.",
    "american_bulldog": "Confident, social, and active working dogs. They are loyal family guardians requiring consistent training and regular exercise.",
    "american_pit_bull_terrier": "Strong, athletic, and friendly. Known for their enthusiasm, high energy, and deep devotion to their family.",
    "basset_hound": "Patient, gentle, and stubborn. Famous for their long velvety ears, short legs, and an exceptional sense of scent tracking.",
    "beagle": "Merry, friendly, and curious. Excellent family dogs with a powerful nose and high energy, originally bred for hunting.",
    "boxer": "Playful, high-spirited, and protective. They have muscular builds, are patient with children, and love participating in active play.",
    "chihuahua": "Tiny dogs with massive, alert personalities. Sassy, expressive, and fiercely protective of their primary owners.",
    "english_cocker_spaniel": "Merry, gentle, and eager to please. They are responsive, medium-sized sporting dogs with beautiful feathered ears.",
    "english_setter": "Gentle, friendly, and placid. Elegant gun dogs known as the 'gentlemen of the dog world' for their sweet manners.",
    "german_shorthaired": "Versatile, all-purpose hunting dogs. Highly intelligent, energetic, and eager to please their owners.",
    "great_pyrenees": "Calm, patient, and smart. Majestic mountain guardians known for their protective nature and white double coats.",
    "havanese": "The national dog of Cuba. Outgoing, funny, and intelligent. They are small, cheerful companions with silky coats.",
    "japanese_chin": "Cat-like, quiet, and loving. Charming toy dogs that are highly clean, perform chin-spins, and enjoy sitting on high perches.",
    "keeshond": "Outgoing, friendly, and alert. They have a distinctive woolly grey coat and dark markings around their eyes resembling spectacles.",
    "leonberger": "Gentle giants. Friendly, intelligent, and calm family companions with a distinctive black mask on their faces.",
    "miniature_pinscher": "Fearless, proud, and fun-loving toy dogs. Known as the 'King of Toys' for their bold, high-stepping gait.",
    "newfoundland": "Devoted, patient, and sweet-tempered. They are massive working dogs, excellent swimmers, and renowned life savers.",
    "pomeranian": "Extremely extroverted, lively, and intelligent toy dogs. They have a fluffy double coat and a fox-like expression.",
    "pug": "Charming, mischievous, and loving. Sturdy, compact companions with wrinkled faces, curled tails, and huge personalities.",
    "saint_bernard": "Friendly, patient, and welcoming. Powerful, giant dogs historically used for alpine rescue work.",
    "samoyed": "Famous for the 'Samoyed smile' caused by slightly upturned mouth corners. Gentle, alert, and friendly dogs with thick white coats.",
    "scottish_terrier": "Independent, bold, and dignified. They have wire-like coats, distinctive beards, and a strong, determined character.",
    "shiba_inu": "Spirited, independent, and very clean. An ancient Japanese breed, fox-like in appearance and fiercely loyal.",
    "staffordshire_bull_terrier": "Brave, tenacious, and highly affectionate. They are deeply family-oriented and especially patient with kids.",
    "wheaten_terrier": "Happy, friendly, and deeply devoted. They have a soft, single, wheat-colored wavy coat and a playful spirit.",
    "yorkshire_terrier": "Feisty, brave, and energetic toy terriers. They feature long, silky blue-and-tan coats and big dog attitudes."
}

# Load generated structured breed database
BREED_INFO_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "breed_info.json"))
BREED_DETAILS_DB = {}
if os.path.exists(BREED_INFO_PATH):
    try:
        with open(BREED_INFO_PATH, "r") as f:
            BREED_DETAILS_DB = json.load(f)
        print(f"Loaded structured breed details for {len(BREED_DETAILS_DB)} breeds.")
    except Exception as e:
        print(f"Error loading breed_info.json: {e}")

# Handle sample images automatically
import shutil
import random

SAMPLE_IMAGES_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "sample-images"))
def init_sample_images():
    if not os.path.exists(SAMPLE_IMAGES_DIR):
        os.makedirs(SAMPLE_IMAGES_DIR)

init_sample_images()

if os.path.exists(SAMPLE_IMAGES_DIR):
    app.mount("/sample-images", CORSStaticFiles(directory=SAMPLE_IMAGES_DIR), name="sample-images")
    print(f"Mounted static directory: {SAMPLE_IMAGES_DIR} at /sample-images")

def get_breed_name_from_filename(filename):
    name_without_ext = os.path.splitext(filename)[0]
    if "___" in name_without_ext:
        breed_raw = name_without_ext.split("___")[0]
    else:
        parts = name_without_ext.split('_')
        if len(parts) > 1 and parts[-1].isdigit():
            breed_raw = '_'.join(parts[:-1])
        else:
            breed_raw = name_without_ext
    return breed_raw.replace("_", " ").title()

@app.get("/samples")
def get_samples():
    if not os.path.exists(SAMPLE_IMAGES_DIR):
        return []
    files = [f for f in os.listdir(SAMPLE_IMAGES_DIR) if os.path.isfile(os.path.join(SAMPLE_IMAGES_DIR, f))]
    samples = []
    for f in files[:5]:
        samples.append({
            "path": f"sample-images/{f}",
            "name": get_breed_name_from_filename(f)
        })
    return samples

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None or len(class_names) == 0:
        raise HTTPException(status_code=500, detail="Machine Learning model or labels not loaded on backend.")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Preprocess matching the training/prediction pipeline
        preprocess = transforms.Compose([
            transforms.Resize((240, 240)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        input_tensor = preprocess(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
            
        predictions = probabilities.cpu().numpy()
        
        # Retrieve Top 3 predictions
        top_indices = np.argsort(predictions)[::-1][:3]
        top_confidences = predictions[top_indices]
        
        results = []
        for rank, (idx, conf) in enumerate(zip(top_indices, top_confidences)):
            raw_name = class_names[idx]
            formatted_name = raw_name.replace("_", " ").title()
            is_cat = raw_name[0].isupper() or (raw_name.lower().replace(" ", "_") in CAT_BREED_SET)
            results.append({
                "rank": rank + 1,
                "raw_name": raw_name,
                "breed_name": formatted_name,
                "confidence": float(conf * 100),
                "pet_type": "Feline" if is_cat else "Canine"
            })
            
        primary = results[0]
        breed_key = primary["raw_name"].lower()
        
        # Load details from the new breed database
        breed_details = BREED_DETAILS_DB.get(breed_key, None)
        
        # Backward-compatible description
        if breed_details:
            about = breed_details.get("description", "")
        else:
            about = BREED_INFO.get(
                breed_key, 
                "No details available for this specific breed. It belongs to the 37 classes of the Oxford-IIIT Pet dataset."
            )
        
        return {
            "success": True,
            "primary": primary,
            "about": about,
            "predictions": results,
            "breed_details": breed_details
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
