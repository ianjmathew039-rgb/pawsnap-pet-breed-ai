# PawSnap                                                                                                 run venv: .\.venv\Scripts\Activate.ps1


React + Vite and FastAPI application for classifying 37 cat and dog breeds from the Oxford-IIIT Pet dataset.

The current production model is the PyTorch EfficientNet-B1 checkpoint:

- `pet_breed_model.pth`

## Current production architecture

- `train.py` - PyTorch EfficientNet-B1 training pipeline
- `evaluate.py` - PyTorch test-set evaluation for `pet_breed_model.pth`
- `predict.py` - standalone PyTorch prediction script and current prediction baseline
- `backend/main.py` - FastAPI backend that loads `pet_breed_model.pth`
- `frontend/` - React + Vite frontend
- `data/` - Oxford-IIIT Pet dataset split into train, validation, and test folders
- `labels.json` - class order used by the PyTorch model and backend

## Quick start

The bundled PowerShell launcher expects a Python virtual environment at `../.venv`.

```powershell
../.venv/Scripts/python.exe -m pip install -r requirements.txt
cd frontend
npm install
cd ..
./run.ps1
```

This starts:

- FastAPI backend: `http://localhost:8000`
- Vite frontend: `http://localhost:5173`

The frontend uses Vite proxies for `/api` and `/data` during local development. For another backend host, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`.

## Common commands

```powershell
# Train the PyTorch model
../.venv/Scripts/python.exe train.py

# Evaluate the production checkpoint
../.venv/Scripts/python.exe evaluate.py

# Run standalone prediction
../.venv/Scripts/python.exe predict.py

# Run the FastAPI backend directly
cd backend
../../.venv/Scripts/python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```



