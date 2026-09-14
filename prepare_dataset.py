import os
import shutil
import random

print("Script started")

SOURCE_DIR = "oxford-iiit-pet/images"
DEST_DIR = "data"

TRAIN_RATIO = 0.7
VAL_RATIO = 0.15
TEST_RATIO = 0.15

breed_images = {}

for filename in os.listdir(SOURCE_DIR):
    if filename.endswith(".jpg"):
        breed = "_".join(filename.split("_")[:-1])

        if breed not in breed_images:
            breed_images[breed] = []

        breed_images[breed].append(filename)

for breed, files in breed_images.items():
    random.shuffle(files)

    total = len(files)
    train_end = int(total * TRAIN_RATIO)
    val_end = train_end + int(total * VAL_RATIO)

    train_files = files[:train_end]
    val_files = files[train_end:val_end]
    test_files = files[val_end:]

    for split_name, split_files in [
        ("train", train_files),
        ("validation", val_files),
        ("test", test_files)
    ]:
        breed_folder = os.path.join(DEST_DIR, split_name, breed)
        os.makedirs(breed_folder, exist_ok=True)

        for file in split_files:
            src = os.path.join(SOURCE_DIR, file)
            dst = os.path.join(breed_folder, file)
            shutil.copy2(src, dst)

print("Dataset prepared successfully!")