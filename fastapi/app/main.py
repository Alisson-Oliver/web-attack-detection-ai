import joblib as jl
import numpy as np
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from pathlib import Path
from .schemas import InputData

ml_artifacts = {}

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR.parent / "models" / "model.pkl" 

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        print(f"Tentando carregar o modelo em: {MODEL_PATH}")
        modelo_rf = jl.load(MODEL_PATH)
        ml_artifacts["model"] = modelo_rf
        ml_artifacts["feature_columns"] = list(InputData.model_fields.keys())
        print("Modelo carregado com sucesso!")
        print(f"Features esperadas ({len(ml_artifacts['feature_columns'])}):", ml_artifacts["feature_columns"])
    except Exception as e:
        print(f"Erro ao carregar o modelo: {e}")
    yield
    ml_artifacts.clear()
    
app = FastAPI(lifespan=lifespan)

@app.post("/predict")
async def predict(data: InputData):
    if "model" not in ml_artifacts:
        raise HTTPException(status_code=503, detail="Modelo não carregado ou indisponível.")
        
    try:
        input_dict = data.model_dump()
        ordered_features = [input_dict[col] for col in ml_artifacts["feature_columns"]]
        model = ml_artifacts["model"]
        prediction_array = np.array(ordered_features).reshape(1, -1)
        score_ataque = float(model.predict_proba(prediction_array)[0][1])
        
        if score_ataque <= 0.60:
            acao = "ok"          
        elif score_ataque <= 0.80:
            acao = "captcha"     
        else:
            acao = "block"      

        return { 
            "status": "success",
            "score": round(score_ataque, 4),
            "action": acao
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)