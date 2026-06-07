Write-Host "1# Inicializando o microserviço FastAPI (IA)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd fastapi; if (Test-Path .venv) { .\.venv\Scripts\activate }; pip install -r requirements.txt; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

Start-Sleep -s 2

Write-Host "2# Inicializando o Gateway NestJS (E-Commerce)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api-ecommerce; npm install; npm run start"

Start-Sleep -s 3

Write-Host "3# Inicializando o Backend do Simulador..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd botshield-ui\backend; if (Test-Path .venv) { .\.venv\Scripts\activate }; pip install -r requirements.txt; python main.py"

Start-Sleep -s 2

Write-Host "4# Inicializando o Dashboard React..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd botshield-ui\frontend; npm install; npm start"

Write-Host "Todos os serviços foram iniciados!" -ForegroundColor Green