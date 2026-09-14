import os
import json

def export_labels(train_dir="data/train", output_file="labels.json"):
    """
    Reads the folder names in the training directory and saves them as a sorted 
    JSON list. This allows the prediction app to work without the dataset.
    """
    if not os.path.exists(train_dir):
        print(f"Error: Directory '{train_dir}' not found.")
        return

    # Get subdirectories and sort them to match Keras flow_from_directory behavior
    class_names = sorted([
        d for d in os.listdir(train_dir) 
        if os.path.isdir(os.path.join(train_dir, d))
    ])

    with open(output_file, "w") as f:
        json.dump(class_names, f, indent=4)
    
    print(f"Successfully exported {len(class_names)} labels to {output_file}")

if __name__ == "__main__":
    export_labels()
