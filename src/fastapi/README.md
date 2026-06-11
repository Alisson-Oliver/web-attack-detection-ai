# Motor de Inferência IA (BotShield - FastAPI)

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Scikit-Learn](https://img.shields.io/badge/scikit_learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)

Este diretório contém o microsserviço de **Inteligência Artificial** do projeto BotShield. Desenvolvido em **Python com FastAPI**, este serviço atua como o "cérebro" do Web Application Firewall (WAF).

O seu objetivo é carregar o modelo de *Machine Learning* (Random Forest) treinado em memória e expor um *endpoint* REST para classificar requisições em tempo real.

## Como Funciona

1. O modelo treinado (`botnet_detector_model.pkl`) é carregado de forma assíncrona durante o arranque do servidor (utilizando a arquitetura `lifespan` do FastAPI).
2. O serviço recebe os dados comportamentais (extraídos em tempo real pelo Gateway E-commerce em NestJS) através da rota `POST /predict`.
   O modelo processa as variáveis (*features*) e calcula a probabilidade matemática da requisição ser um ataque.
3. O serviço devolve uma instrução imediata de mitigação (`ok`, `captcha` ou `block`).

## Estrutura da Diretoria

```text
fastapi/k
├── app/
│   ├── main.py        # Ponto de entrada da API e lógica de inferência
│   └── schemas.py     # Contratos de dados (Pydantic Models) para validação
├── models/
│   └── botnet_detector_model.pkl  # O modelo Random Forest exportado via Joblib
├── requirements.txt   # Dependências do Python
└── run.py             # Script utilitário para arrancar o servidor Uvicorn