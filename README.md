# BotShield AI  — Web Application Firewall com Detecção de Ataques por IA

## 📋 Sobre o Projeto

**BotShield AI ** é um Web Application Firewall (WAF) inteligente que utiliza Machine Learning para detectar e bloquear ataques em tempo real. O sistema analisa padrões de tráfego HTTP e identifica comportamentos suspeitos (força bruta, scrapers, DDoS, etc.) através de um modelo de IA treinado com scikit-learn.

### Objetivos Principais

✅ **Detecção em Tempo Real** — Analisa cada requisição e toma decisões instantâneas (ALLOW/CAPTCHA/BLOCK)  
✅ **Múltiplos Perfis de Ataque** — Simula 5 tipos diferentes de ataques para teste  
✅ **Dashboard Ao Vivo** — Console interativo para monitorar tráfego e decisões da IA  
✅ **Arquitetura Modular** — Backend (NestJS) + ML Server (FastAPI) + Frontend (React)  
✅ **Métricas por Perfil** — Rastreia estatísticas de segurança para cada tipo de ataque  

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    SENTINEL.AI Dashboard                     │
│              (React 19 + TanStack Start + Tailwind)          │
│                   monitoring-dashboard/                      │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP Requests (com IP spoofing)
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                   NestJS API (Port 3050)                     │
│                     api-ecommerce/                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         AttackMiddleware (Todos os endpoints)         │  │
│  │  • Extrai features do IP (taxa, endpoints, erros)     │  │
│  │  • Envia para FastAPI para predição                   │  │
│  │  • Decide: ALLOW (200) / CAPTCHA (401) / BLOCK (403) │  │
│  │  • Retorna header X-WAF-Decision                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Routes:                                                     │
│  GET  /api/produtos, /api/jogos, /api/softwares, etc       │
│  POST /api/login                                            │
│  GET  /api/admin/live-stats (estatísticas por perfil)      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│          FastAPI ML Server (Port 8000)                       │
│                     fastapi/                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │    RandomForest Classifier (botnet_detector_model)    │  │
│  │  Input: 11 features (req/min, endpoints, headers, etc)│  │
│  │  Output: {"status", "score", "action"}                │  │
│  │  Decision: score ≤ 0.60 (ok) | 0.60-0.80 (captcha)   │  │
│  │            score > 0.80 (block)                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- **Node.js** 18+ (para frontend e backend)
- **Python** 3.9+ (para FastAPI)
- **npm** ou **yarn** (gerenciador de pacotes)

### 1️⃣ FastAPI (Servidor de IA)

```bash
cd fastapi

# Instalar dependências
pip install -r requirements.txt

# Rodar servidor (porta 8000)
python app/main.py
# ou
python run.py
```

O servidor ficará disponível em `http://localhost:8000`. Acesse `/docs` para ver a API interativa.

---

### 2️⃣ NestJS Backend (API de Ecommerce)

```bash
cd api-ecommerce

# Instalar dependências
npm install
# ou
yarn install

# Rodar em desenvolvimento (porta 3050)
npm run start:dev
# ou
yarn start:dev
```

O backend ficará disponível em `http://localhost:3050`. A middleware de segurança será aplicada a todas as rotas.

**Endpoints disponíveis:**
- `GET  /` — Health check
- `GET  /api/produtos` — Lista de produtos
- `GET  /api/jogos` — Lista de jogos
- `GET  /api/softwares` — Lista de softwares
- `GET  /api/promocoes` — Promoções
- `GET  /api/lancamentos` — Novos lançamentos
- `POST /api/login` — Login (retorna 401)
- `GET  /api/admin/live-stats` — Estatísticas de segurança por perfil

---

### 3️⃣ React Frontend (Dashboard de Monitoramento)

```bash
cd monitoring-dashboard

# Instalar dependências
npm install
# ou
yarn install

# Rodar em desenvolvimento (porta 3000)
npm run dev
```

O dashboard ficará disponível em `http://localhost:3000`.

---

## 📊 Como Usar o Dashboard

### Seleção de Perfil

O dropdown "**Attack Profile**" oferece 5 perfis de ataque:

| Perfil | IP Range | Delay | Características |
|--------|----------|-------|-----------------|
| **Normal User** | `200.150.x.x` | 2–5 s | Navegação humana, User-Agent Chrome |
| **Brute Force Bot** | `10.0.x.x` | 100–300 ms | Força bruta no login com senhas aleatórias |
| **Scraper Bot** | `192.168.x.x` | 1–3 s | Mapeamento de endpoints secretos |
| **DoS Single IP** | `66.66.66.66` (fixo) | 0–50 ms | Flood de uma única fonte |
| **DDoS Botnet** | `172.16.x.x` | 100–500 ms | Ataque distribuído em paralelo |

### Fluxo de Teste

1. **Selecionar um perfil** no dropdown
2. **Clicar em "Continuous Traffic"** para iniciar a simulação
3. **Observar o console** na esquerda com as requisições em tempo real
4. **Monitorar o painel** central com estatísticas (ALLOW/CAPTCHA/BLOCK)
5. **Verificar a tabela** de logs com detalhes de cada requisição

### Interpretando os Logs

| Coluna | Significado |
|--------|-------------|
| **Script** | Tipo de perfil (Normal / Ataque) |
| **Timestamp** | Hora da requisição |
| **Method** | GET (verde) ou POST (amarelo) |
| **Request Path** | Endpoint chamado |
| **Source IP** | IP spoofado da requisição |
| **Entropy** | Score de suspeita (0-7) — quanto maior, mais suspeito |
| **Status** | Decisão da IA (ALLOW / CAPTCHA / BLOCK) |

---

## 🔄 Fluxo de Requisição Completo

### Exemplo: Brute Force Bot

```
1. Frontend gera IP 10.0.123.45 (range Brute Force)
   ↓
2. Faz POST /api/login com X-Forwarded-For: 10.0.123.45
   ↓
3. NestJS Middleware intercepta
   ├─ Extrai features (2ª requisição do IP, intervalo curto, User-Agent "python-requests")
   ├─ Envia para FastAPI: {req_per_minute: 2, avg_req_interval_ms: 50, ...}
   └─ Recebe score: 0.85 (alto risco)
   ↓
4. Middleware decide: score > 0.80 → "block"
   ├─ Retorna HTTP 403
   ├─ Header: X-WAF-Decision: BLOCK
   └─ Log: profileStats['2. Força Bruta (10.0.*)'].BLOCK++
   ↓
5. Frontend recebe 403 + header X-WAF-Decision: BLOCK
   ├─ Exibe no console: "POST /api/login · 10.0.123.45 → BLOCK [HTTP 403]"
   ├─ Atualiza contador de BLOCK
   └─ Adiciona linha na tabela de logs
```

---

## 🛠️ Configuração Avançada

### Variáveis de Ambiente

**api-ecommerce/.env**
```env
PORT=3050
NODE_ENV=development
```

**fastapi/.env** (opcional)
```env
WORKERS=4
LOG_LEVEL=info
```

**monitoring-dashboard/.env**
```env
VITE_API_URL=http://localhost:3050
VITE_ML_URL=http://localhost:8000
```

### Personalizar Perfis

Edite `monitoring-dashboard/src/lib/waf-profiles.ts` para:
- Mudar ranges de IP
- Ajustar delays entre requisições
- Adicionar novos endpoints
- Modificar User-Agents

---

## 📈 Métricas e Estatísticas

### Endpoint `/api/admin/live-stats` (GET)

Retorna estatísticas em tempo real por perfil:

```json
{
  "1. Humano (200.150.*)": { "ALLOW": 45, "CAPTCHA": 2, "BLOCK": 0 },
  "2. Força Bruta (10.0.*)": { "ALLOW": 0, "CAPTCHA": 5, "BLOCK": 15 },
  "3. Scraper (192.168.*)": { "ALLOW": 2, "CAPTCHA": 8, "BLOCK": 12 },
  "4. DoS Single (66.66.*)": { "ALLOW": 0, "CAPTCHA": 0, "BLOCK": 38 },
  "5. Botnet (172.16.*)": { "ALLOW": 1, "CAPTCHA": 3, "BLOCK": 22 },
  "Outros": { "ALLOW": 5, "CAPTCHA": 0, "BLOCK": 1 }
}
```

---

## 🧪 Testes Manuais (Alternativa ao Dashboard)

Use o script Python para testes sem o frontend:

```bash
cd testing
python simulador_trafego.py

# Escolha uma opção:
# 1. Simular Humano
# 2. Simular Scraping
# 3. Simular Força Bruta
# 4. Simular DDoS
```

---

## 📋 Estrutura de Diretórios

```
web-attack-detection-ai/
├── api-ecommerce/              # Backend NestJS
│   ├── src/
│   │   ├── main.ts            # Entry point com CORS
│   │   ├── app.controller.ts   # Endpoints da API
│   │   └── attacks-detection/
│   │       ├── attack.middleware.ts       # Middleware de segurança
│   │       ├── attack-cache.service.ts    # Extração de features
│   │       └── attack-module.ts           # Módulo NestJS
│   └── package.json
│
├── fastapi/                    # Servidor de IA
│   ├── app/
│   │   ├── main.py            # FastAPI app
│   │   └── schemas.py          # Modelos Pydantic
│   ├── models/
│   │   └── botnet_detector_model.pkl    # Modelo treinado
│   └── requirements.txt
│
├── monitoring-dashboard/       # Frontend React
│   ├── src/
│   │   ├── routes/            # Páginas (TanStack Router)
│   │   ├── components/
│   │   │   └── waf/
│   │   │       ├── Dashboard.tsx          # Componente principal
│   │   │       ├── TrafficChart.tsx
│   │   │       ├── StatusBadge.tsx
│   │   │       └── ScriptTypeBadge.tsx
│   │   ├── lib/
│   │   │   ├── waf-profiles.ts          # Definições dos perfis
│   │   │   └── waf-simulator.ts          # Lógica de fetch HTTP
│   │   └── components/ui/               # Componentes Radix UI
│   └── package.json
│
├── testing/                    # Scripts de teste
│   ├── simulador_trafego.py   # Simulador em Python
│   └── requirements.txt
│
└── README.md                   # Este arquivo
```

---

## 🔐 Segurança & Detecção

### Features Extraídas pela IA

A middleware envia 11 features para o modelo:

1. **req_per_minute** — Requisições por minuto do IP
2. **avg_req_interval_ms** — Intervalo médio entre requisições
3. **distinct_endpoints_accessed** — Quantos endpoints diferentes o IP tocou
4. **error_rate** — Taxa de erro (respostas 400+)
5. **payload_size_bytes** — Tamanho do corpo da requisição
6. **user_agent_is_known** — User-Agent é de navegador conhecido?
7. **missing_standard_headers** — Headers HTTP padrão ausentes?
8. **is_post_request** — Requisição é POST?
9. **is_datacenter_ip** — IP é de data center (proxy/VPN)?
10. **window_total_req** — Total de requisições na janela de 60s
11. **unique_ips_in_window** — Quantos IPs únicos na janela

### Decisões da IA

```
Score ≤ 0.60  → ALLOW  (✅ acesso permitido, HTTP 200)
0.60 < Score ≤ 0.80  → CAPTCHA (⚠️ verificação necessária, HTTP 401)
Score > 0.80  → BLOCK  (🔒 acesso bloqueado, HTTP 403)
```

---

## 🐛 Troubleshooting

### Backend (NestJS) não conecta ao FastAPI

```
❌ Error: "IA indisponível. Fail-Open aplicado."
```

**Solução:**
1. Verifique se FastAPI está rodando na porta 8000
2. Teste: `curl http://localhost:8000/docs`
3. Reinicie ambos os serviços

### Frontend não vê os logs

```
❌ "connection error — backend offline?"
```

**Solução:**
1. Verifique se NestJS está rodando na porta 3050
2. Teste: `curl http://localhost:3050/`
3. Verifique CORS no `api-ecommerce/src/main.ts`

### Requisições muito lentas

**Causa:** Múltiplas requisições em série esperando respostas  
**Solução:** Dashboard agora faz requisições em paralelo para ataques. Upgrade para a versão mais recente.

---

## 📞 Contato & Suporte

Para dúvidas ou issues, verifique:
- Logs do backend: `security_audit.log`
- Console do navegador (F12) para erros do frontend
- Logs do FastAPI para predições

---

## 📄 Licença

Projeto educacional para demonstração de detecção de ataques com IA.

---

**Desenvolvido com ❤️ para security research e testing.**
