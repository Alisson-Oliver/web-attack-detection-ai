#!/bin/bash

echo "1# Inicializando o microserviço FastAPI (IA)..."
cd fastapi
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
pip install -r requirements.txt --quiet
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
cd ..

sleep 2

echo "2# Inicializando o Gateway NestJS (E-Commerce)..."
cd api-ecommerce
npm install --no-audit --quiet
npm run start &
cd ..

sleep 3

echo "3# Inicializando o Backend do Simulador..."
cd botshield-ui/backend
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
pip install -r requirements.txt --quiet
python main.py &
cd ../..

sleep 2

echo "4# Inicializando o Dashboard React..."
cd botshield-ui/frontend
npm install --no-audit --quiet
npm start &
cd ../..

echo "Todos os serviços foram iniciados!"
echo "FastAPI: http://localhost:8000"
echo "NestJS API: http://localhost:3050"
echo "Dashboard UI: http://localhost:3000 (ou porta aberta pelo React)"

wait