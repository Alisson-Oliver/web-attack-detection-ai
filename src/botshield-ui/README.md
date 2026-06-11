# BotShield UI

Dashboard web para visualização em tempo real das simulações de ciberataques.

## Estrutura

```
botshield-ui/
├── backend/
│   ├── main.py          
│   ├── simulator.py     
│   └── requirements.txt
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.js
    │   ├── index.css
    │   └── hooks/
    │       └── useSimulator.js
    └── package.json
```

## Como rodar

### 1. Backend (porta 8001)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

O `simulator.py` deve estar na mesma pasta que o `main.py`.
O simulador faz requisições para `http://localhost:3050` — ajuste `BASE_URL` no `simulator.py` se necessário.

### 2. Frontend (porta 3000)

```bash
cd frontend
npm install
npm start
```

Acesse `http://localhost:3000`.

