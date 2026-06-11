"""
BotShield — Simulador de Ciberataques
Versão headless: sem emojis, output estruturado para o backend parsear.
"""

import requests
import time
import random
import threading
import sys

BASE_URL = "http://localhost:3050"
ENDPOINTS_CATALOGO = ["/api/produtos", "/api/jogos", "/api/softwares", "/api/promocoes", "/api/lancamentos"]
ENDPOINT_LOGIN = "/api/login"

def fazer_requisicao(endpoint, perfil_nome="Desconhecido", method="GET", headers=None, json_payload=None):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=2)
        else:
            response = requests.post(url, headers=headers, json=json_payload, timeout=2)

        ip = headers.get("X-Forwarded-For", "Desconhecido")
        decisao = response.headers.get("X-WAF-Decision", "N/A")

        print(
            f"[{response.status_code}] [{perfil_nome:<11}] IP: {ip:<15} | {method:<4} {endpoint:<25} -> {decisao}",
            flush=True
        )
    except requests.exceptions.RequestException:
        pass


POOL_HUMANO = [f"200.150.{random.randint(1,255)}.{random.randint(1,255)}" for _ in range(15)]
POOL_LOCK = threading.Lock()

def loop_humano():
    headers_base = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
    }
    
    meu_ip = f"200.150.{random.randint(1,255)}.{random.randint(1,255)}"
    requisicoes_na_sessao = 0
    duracao_sessao = random.randint(5, 15)
    
    while True:
        if requisicoes_na_sessao >= duracao_sessao:
            meu_ip = f"200.150.{random.randint(1,255)}.{random.randint(1,255)}"
            requisicoes_na_sessao = 0
            duracao_sessao = random.randint(5, 15)
        
        headers = {**headers_base, "X-Forwarded-For": meu_ip}
        
        if random.random() < 0.8:
            fazer_requisicao(random.choice(ENDPOINTS_CATALOGO), "Humano", "GET", headers)
        else:
            fazer_requisicao(ENDPOINT_LOGIN, "Humano", "POST", headers, {"user": "alisson", "pass": "senha123"})
        
        requisicoes_na_sessao += 1
        time.sleep(random.uniform(2.0, 5.0))

def loop_brute_force():
    meu_ip = f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}"
    headers = {
        "X-Forwarded-For": meu_ip,
        "User-Agent": "python-requests/2.28.1",
    }
    while True:
        payload = {"user": "admin", "pass": f"senha_{random.randint(1, 9999)}"}
        fazer_requisicao(ENDPOINT_LOGIN, "Brute Force", "POST", headers, payload)
        time.sleep(random.uniform(0.1, 0.3))


def loop_scraper():
    meu_ip = f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}"
    headers = {
        "X-Forwarded-For": meu_ip,
        "User-Agent": "Scrapy/2.11 (Bot)",
    }
    contador = 1
    while True:
        fazer_requisicao(f"/api/pasta_secreta_{contador}", "Scraper", "GET", headers)
        contador += 1
        time.sleep(random.uniform(1.0, 3.0))


def loop_dos_single():
    headers = {
        "X-Forwarded-For": "66.66.66.66",
        "User-Agent": "curl/7.68.0",
    }
    while True:
        fazer_requisicao("/api/produtos", "DoS Single", "GET", headers)


def loop_botnet():
    meu_ip = f"172.16.{random.randint(1, 255)}.{random.randint(1, 255)}"
    headers = {
        "X-Forwarded-For": meu_ip,
        "User-Agent": "Mozilla/5.0 (Botnet Node)",
    }
    while True:
        fazer_requisicao(random.choice(["/api/lancamentos", "/api/promocoes"]), "Botnet", "GET", headers)
        time.sleep(random.uniform(0.1, 0.5))


def iniciar_ataque(target_function, qtd_threads):
    threads = []
    for _ in range(qtd_threads):
        t = threading.Thread(target=target_function, daemon=True)
        t.start()
        threads.append(t)
    try:
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        sys.exit(0)


def iniciar_modo_misto(total_threads=100):
    qtd_humanos  = 35   
    qtd_bf       = int(total_threads * 0.05)
    qtd_scraper  = int(total_threads * 0.05)
    qtd_dos      = int(total_threads * 0.02)
    qtd_botnet   = int(total_threads * 0.08)
    
    for _ in range(qtd_humanos):  threading.Thread(target=loop_humano,      daemon=True).start()
    for _ in range(qtd_bf):       threading.Thread(target=loop_brute_force,  daemon=True).start()
    for _ in range(qtd_scraper):  threading.Thread(target=loop_scraper,      daemon=True).start()
    for _ in range(qtd_dos):      threading.Thread(target=loop_dos_single,   daemon=True).start()
    for _ in range(qtd_botnet):   threading.Thread(target=loop_botnet,       daemon=True).start()
    
    try:
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        sys.exit(0)


if __name__ == "__main__":
    escolha = input("").strip()
    if escolha == '1':   iniciar_ataque(loop_humano,      35) 
    elif escolha == '2': iniciar_ataque(loop_scraper,     20)
    elif escolha == '3': iniciar_ataque(loop_brute_force, 50)
    elif escolha == '4': iniciar_ataque(loop_dos_single,   5)
    elif escolha == '5': iniciar_ataque(loop_botnet,      150)
    elif escolha == '6': iniciar_modo_misto(100)
    else:                sys.exit(1)